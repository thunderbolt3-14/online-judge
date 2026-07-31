import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const AdminPanel = () => {
  const { user } = useSelector((state) => state.auth);

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [draft, setDraft] = useState(null);
  const [genStatus, setGenStatus] = useState('idle');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [error, setError] = useState('');

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 40 }}>
        <p>Admin access required.</p>
        <Link to="/">← Back home</Link>
      </div>
    );
  }

  const handleGenerate = async () => {
    setGenStatus('loading');
    setError('');
    setDraft(null);
    setSaveStatus('idle');
    try {
      const res = await api.post('/problems/generate', { topic, difficulty });
      setDraft(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate problem');
    }
    setGenStatus('idle');
  };

  const updateDraftField = (field, value) => {
    setDraft({ ...draft, [field]: value });
  };

  const handleSave = async () => {
    setSaveStatus('loading');
    setError('');
    try {
      await api.post('/problems', {
        name: draft.name,
        code: draft.code,
        statement: draft.statement,
        difficulty: draft.difficulty,
        timeLimitMs: draft.timeLimitMs,
        memoryLimitKb: draft.memoryLimitKb,
      });

      for (const tc of draft.sampleTestCases) {
        await api.post(`/problems/${draft.code}/testcases`, {
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: false,
        });
      }

      setSaveStatus('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save problem');
      setSaveStatus('idle');
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>
      <Link to="/">← Back to problems</Link>
      <h1>AI Problem Generator</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <input
          placeholder="Topic (e.g. binary search on rotated array)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ marginBottom: 10 }}>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <div>
          <button onClick={handleGenerate} disabled={genStatus === 'loading' || !topic}>
            {genStatus === 'loading' ? 'Generating…' : 'Generate problem'}
          </button>
        </div>
        {error && <p style={{ color: 'var(--verdict-error)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{error}</p>}
      </div>

      {draft && (
        <div className="card">
          <label>Name</label>
          <input value={draft.name} onChange={(e) => updateDraftField('name', e.target.value)} style={{ width: '100%', marginBottom: 10 }} />

          <label>Code</label>
          <input value={draft.code} onChange={(e) => updateDraftField('code', e.target.value)} style={{ width: '100%', marginBottom: 10 }} />

          <label>Difficulty</label>
          <select value={draft.difficulty} onChange={(e) => updateDraftField('difficulty', e.target.value)} style={{ marginBottom: 10 }}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <label>Statement</label>
          <textarea
            value={draft.statement}
            onChange={(e) => updateDraftField('statement', e.target.value)}
            rows={10}
            style={{ width: '100%', marginBottom: 10 }}
          />

          <label>Time limit (ms)</label>
          <input
            type="number"
            value={draft.timeLimitMs}
            onChange={(e) => updateDraftField('timeLimitMs', Number(e.target.value))}
            style={{ width: '100%', marginBottom: 10 }}
          />

          <label>Memory limit (KB)</label>
          <input
            type="number"
            value={draft.memoryLimitKb}
            onChange={(e) => updateDraftField('memoryLimitKb', Number(e.target.value))}
            style={{ width: '100%', marginBottom: 10 }}
          />

          <h3>Sample test cases</h3>
          {draft.sampleTestCases.map((tc, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>input</div>
              <pre>{tc.input}</pre>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>expected output</div>
              <pre>{tc.expectedOutput}</pre>
            </div>
          ))}

          <button onClick={handleSave} disabled={saveStatus === 'loading' || saveStatus === 'done'}>
            {saveStatus === 'done' ? 'Saved ✓' : saveStatus === 'loading' ? 'Saving…' : 'Save problem'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;