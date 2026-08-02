import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { fetchProblems } from '../store/slices/problemsSlice';

const AdminPanel = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { list: problems } = useSelector((state) => state.problems);

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [draft, setDraft] = useState(null);
  const [genStatus, setGenStatus] = useState('idle');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [error, setError] = useState('');

  const [plagProblemCode, setPlagProblemCode] = useState('');
  const [plagThreshold, setPlagThreshold] = useState(60);
  const [plagResult, setPlagResult] = useState(null);
  const [plagStatus, setPlagStatus] = useState('idle');
  const [plagError, setPlagError] = useState('');

  useEffect(() => {
    dispatch(fetchProblems());
  }, [dispatch]);

  useEffect(() => {
    if (problems.length > 0 && !plagProblemCode) {
      setPlagProblemCode(problems[0].code);
    }
  }, [problems, plagProblemCode]);

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

  const handleRunPlagiarismCheck = async () => {
    setPlagStatus('loading');
    setPlagError('');
    setPlagResult(null);
    try {
      const res = await api.get(`/problems/${plagProblemCode}/plagiarism`, {
        params: { threshold: plagThreshold },
      });
      setPlagResult(res.data);
    } catch (err) {
      setPlagError(err.response?.data?.message || 'Failed to run plagiarism check');
    }
    setPlagStatus('idle');
  };

  const scoreColor = (score) => {
    if (score >= 80) return 'var(--verdict-error)';
    if (score >= 60) return 'var(--verdict-pending)';
    return 'var(--text-primary)';
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

      <h1 style={{ marginTop: 48 }}>Plagiarism Check</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <select value={plagProblemCode} onChange={(e) => setPlagProblemCode(e.target.value)} style={{ marginBottom: 10 }}>
          {problems.map((p) => (
            <option key={p._id} value={p.code}>{p.name}</option>
          ))}
        </select>

        <div style={{ marginBottom: 10 }}>
          <label style={{ marginRight: 8 }}>Similarity threshold (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={plagThreshold}
            onChange={(e) => setPlagThreshold(Number(e.target.value))}
            style={{ width: 80 }}
          />
        </div>

        <button onClick={handleRunPlagiarismCheck} disabled={plagStatus === 'loading' || !plagProblemCode}>
          {plagStatus === 'loading' ? 'Checking…' : 'Run check'}
        </button>

        {plagError && <p style={{ color: 'var(--verdict-error)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{plagError}</p>}
      </div>

      {plagResult && (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            {plagResult.checkedSubmissions} submissions checked, {plagResult.matches.length} match(es) at or above {plagThreshold}%
          </p>

          {plagResult.matches.length === 0 ? (
            <p>No matches found at this threshold.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>User A</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>User B</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>Similarity</th>
                </tr>
              </thead>
              <tbody>
                {plagResult.matches.map((m, i) => (
                  <tr key={i}>
                    <td>{m.submissionA.username}</td>
                    <td>{m.submissionB.username}</td>
                    <td style={{ color: scoreColor(m.score), fontFamily: 'var(--font-mono)' }}>{m.score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;