import { useState } from 'react';
import api from '../api/axios';

const VERDICT_LABELS = {
  queued: 'queued',
  running: 'running',
  accepted: 'accepted',
  wrong_answer: 'wrong_answer',
  tle: 'time_limit_exceeded',
  mle: 'memory_limit_exceeded',
  runtime_error: 'runtime_error',
  compile_error: 'compile_error',
};

const isPending = (status) => status === 'queued' || status === 'running';
const isSuccess = (status) => status === 'accepted';
const isFailed = (status) => !isPending(status) && !isSuccess(status);

const VerdictDisplay = ({ submission }) => {
  const [hint, setHint] = useState('');
  const [hintStatus, setHintStatus] = useState('idle');

  if (!submission) return null;

  const { status, executionTimeMs, _id } = submission;
  const label = VERDICT_LABELS[status] || status;
  const pending = isPending(status);
  const success = isSuccess(status);
  const failed = isFailed(status);

  const handleGetHint = async () => {
    setHintStatus('loading');
    try {
      const res = await api.post(`/submissions/${_id}/hint`);
      setHint(res.data.hint);
    } catch (err) {
      setHint(err.response?.data?.message || 'Failed to get hint');
    }
    setHintStatus('idle');
  };

  return (
    <>
      <div
        className="card"
        style={{
          marginTop: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderColor: pending ? 'var(--verdict-pending)' : success ? 'var(--verdict-accepted)' : 'var(--verdict-error)',
        }}
      >
        <span style={{ color: 'var(--text-muted)' }}>$</span>
        <span style={{ color: 'var(--text-muted)' }}>judge --submit</span>
        <span style={{ color: 'var(--text-muted)' }}>→</span>
        {pending ? (
          <span style={{ color: 'var(--verdict-pending)' }}>
            {label}
            <span className="blink-cursor">▍</span>
          </span>
        ) : (
          <span style={{ color: success ? 'var(--verdict-accepted)' : 'var(--verdict-error)' }}>
            {success ? '✓' : '✗'} {label}
          </span>
        )}
        {!pending && executionTimeMs != null && (
          <span style={{ color: 'var(--text-muted)' }}>[{executionTimeMs}ms]</span>
        )}
      </div>

      {failed && (
        <div style={{ marginTop: 10 }}>
          <button className="secondary" onClick={handleGetHint} disabled={hintStatus === 'loading'}>
            {hintStatus === 'loading' ? 'Thinking…' : 'Get AI hint'}
          </button>
          {hint && (
            <div className="card" style={{ marginTop: 10, fontSize: 14 }}>
              {hint}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default VerdictDisplay;