import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import { fetchProblemByCode } from '../store/slices/problemsSlice';
import { createSubmission, clearCurrentSubmission, submissionUpdated } from '../store/slices/submissionsSlice';
import VerdictDisplay from '../components/VerdictDisplay';
import socket from '../api/socket';

const LANGUAGE_DEFAULTS = {
  python: '# Write your solution here\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
  javascript: '// Write your solution here\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n',
};

const difficultyClass = (d) => (d || '').toLowerCase();

const ProblemDetail = () => {
  const { code } = useParams();
  const dispatch = useDispatch();
  const { current } = useSelector((state) => state.problems);
  const { current: submission, status: submitStatus } = useSelector((state) => state.submissions);
  const { user } = useSelector((state) => state.auth);

  const [language, setLanguage] = useState('python');
  const [sourceCode, setSourceCode] = useState(LANGUAGE_DEFAULTS.python);
  const [authWarning, setAuthWarning] = useState(false);
  const pendingSubmissionId = useRef(null);

  useEffect(() => {
    dispatch(fetchProblemByCode(code));
    dispatch(clearCurrentSubmission());
  }, [dispatch, code]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setSourceCode(LANGUAGE_DEFAULTS[lang]);
  };

  const handleSubmit = async () => {
    if (!user) {
      setAuthWarning(true);
      return;
    }
    setAuthWarning(false);
    const result = await dispatch(createSubmission({ problemCode: code, code: sourceCode, language }));
    if (result.payload?._id) {
      pendingSubmissionId.current = result.payload._id;
      socket.emit('join:submission', result.payload._id);
    }
  };

  useEffect(() => {
    const handleUpdate = (payload) => {
      dispatch(submissionUpdated(payload));
      if (payload.status !== 'queued' && payload.status !== 'running') {
        socket.emit('leave:submission', payload.submissionId);
        pendingSubmissionId.current = null;
      }
    };

    const handleReconnect = () => {
      if (pendingSubmissionId.current) {
        socket.emit('join:submission', pendingSubmissionId.current);
      }
    };

    socket.on('submission:update', handleUpdate);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('submission:update', handleUpdate);
      socket.off('connect', handleReconnect);
    };
  }, [dispatch]);

  if (!current) return <p style={{ padding: 20, color: 'var(--text-muted)' }}>Loading…</p>;

  const { problem, sampleTestCases } = current;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
      <Link to="/">← Back to problems</Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <h1 style={{ margin: 0 }}>{problem.name}</h1>
        <span className={`tag ${difficultyClass(problem.difficulty)}`}>{problem.difficulty}</span>
      </div>

      <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', marginTop: 16 }}>{problem.statement}</p>

      {sampleTestCases.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>Sample test cases</h3>
          {sampleTestCases.map((tc) => (
            <div key={tc._id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>input</div>
              <pre>{tc.input}</pre>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 4px' }}>expected output</div>
              <pre>{tc.expectedOutput}</pre>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: 28 }}>Your solution</h3>
      <div style={{ marginBottom: 8 }}>
        <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
        </select>
      </div>

      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        <Editor
          height="400px"
          language={language === 'cpp' ? 'cpp' : language}
          value={sourceCode}
          onChange={(value) => setSourceCode(value)}
          theme="vs-dark"
          options={{ fontSize: 14, fontFamily: 'JetBrains Mono, monospace', minimap: { enabled: false } }}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <button onClick={handleSubmit} disabled={submitStatus === 'loading'}>
          {submitStatus === 'loading' ? 'Submitting…' : 'Submit'}
        </button>
      </div>

      {authWarning && (
        <p style={{ color: 'var(--verdict-error)', fontFamily: 'var(--font-mono)', fontSize: 13, marginTop: 10 }}>
          log in to submit a solution
        </p>
      )}

      <VerdictDisplay submission={submission} />
    </div>
  );
};

export default ProblemDetail;