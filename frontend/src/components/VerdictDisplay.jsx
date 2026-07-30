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

const VerdictDisplay = ({ submission }) => {
  if (!submission) return null;

  const { status, executionTimeMs } = submission;
  const label = VERDICT_LABELS[status] || status;
  const pending = isPending(status);
  const success = isSuccess(status);

  return (
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
  );
};

export default VerdictDisplay;