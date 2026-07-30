import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Editor from '@monaco-editor/react';
import { fetchProblemByCode } from '../store/slices/problemsSlice';
import { createSubmission, fetchSubmission, clearCurrentSubmission } from '../store/slices/submissionsSlice';

const LANGUAGE_DEFAULTS = {
  python: '# Write your solution here\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
  javascript: '// Write your solution here\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n',
};

const ProblemDetail = () => {
  const { code } = useParams();
  const dispatch = useDispatch();
  const { current } = useSelector((state) => state.problems);
  const { current: submission, status: submitStatus } = useSelector((state) => state.submissions);
  const { user } = useSelector((state) => state.auth);

  const [language, setLanguage] = useState('python');
  const [sourceCode, setSourceCode] = useState(LANGUAGE_DEFAULTS.python);
  const pollRef = useRef(null);

  useEffect(() => {
    dispatch(fetchProblemByCode(code));
    dispatch(clearCurrentSubmission());
    return () => clearInterval(pollRef.current);
  }, [dispatch, code]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setSourceCode(LANGUAGE_DEFAULTS[lang]);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Please log in to submit');
      return;
    }
    const result = await dispatch(createSubmission({ problemCode: code, code: sourceCode, language }));
    if (result.payload?._id) {
      pollRef.current = setInterval(() => {
        dispatch(fetchSubmission(result.payload._id));
      }, 1500);
    }
  };

  useEffect(() => {
    if (submission && submission.status !== 'queued' && submission.status !== 'running') {
      clearInterval(pollRef.current);
    }
  }, [submission]);

  if (!current) return <p>Loading...</p>;

  const { problem, sampleTestCases } = current;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <Link to="/">&larr; Back to problems</Link>
      <h1>{problem.name}</h1>
      <p><strong>Difficulty:</strong> {problem.difficulty}</p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{problem.statement}</p>

      {sampleTestCases.length > 0 && (
        <div>
          <h3>Sample Test Cases</h3>
          {sampleTestCases.map((tc) => (
            <div key={tc._id} style={{ marginBottom: 10 }}>
              <strong>Input:</strong>
              <pre>{tc.input}</pre>
              <strong>Expected Output:</strong>
              <pre>{tc.expectedOutput}</pre>
            </div>
          ))}
        </div>
      )}

      <h3>Your Solution</h3>
      <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
        <option value="python">Python</option>
        <option value="cpp">C++</option>
        <option value="javascript">JavaScript</option>
        <option value="java">Java</option>
      </select>

      <Editor
        height="400px"
        language={language === 'cpp' ? 'cpp' : language}
        value={sourceCode}
        onChange={(value) => setSourceCode(value)}
        theme="vs-dark"
      />

      <button onClick={handleSubmit} disabled={submitStatus === 'loading'} style={{ marginTop: 10 }}>
        Submit
      </button>

      {submission && (
        <div style={{ marginTop: 16, padding: 12, border: '1px solid #ccc' }}>
          <strong>Verdict:</strong> {submission.status}
          {submission.executionTimeMs != null && ` (${submission.executionTimeMs}ms)`}
        </div>
      )}
    </div>
  );
};

export default ProblemDetail;