import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const Bar = ({ label, value, max, suffix = '' }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)' }}>{value}{suffix}</span>
    </div>
    <div style={{ background: 'var(--bg-surface-hover)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div
        style={{
          width: max > 0 ? `${(value / max) * 100}%` : '0%',
          background: 'var(--accent-action)',
          height: '100%',
        }}
      />
    </div>
  </div>
);

const StatCard = ({ label, value }) => (
  <div
    style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      padding: 16,
      flex: 1,
      minWidth: 140,
    }}
  >
    <h3 style={{ margin: 0 }}>{label}</h3>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginTop: 6 }}>{value}</div>
  </div>
);

const Analytics = () => {
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    api
      .get('/analytics')
      .then((res) => {
        setData(res.data);
        setStatus('success');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load analytics');
        setStatus('error');
      });
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 40 }}>
        <p>Admin access required.</p>
        <Link to="/">&larr; Back home</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <Link to="/">&larr; Back to problems</Link>
      <h1>Analytics</h1>

      {status === 'loading' && <p>Loading...</p>}
      {status === 'error' && <p style={{ color: 'var(--verdict-error)' }}>{error}</p>}

      {status === 'success' && data && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '16px 0' }}>
            <StatCard label="Total Submissions" value={data.totalSubmissions} />
            <StatCard label="Acceptance Rate" value={`${data.acceptanceRate}%`} />
            <StatCard label="Total Users" value={data.totalUsers} />
            <StatCard label="Active (7d)" value={data.activeUsers7d} />
            <StatCard label="Active (30d)" value={data.activeUsers30d} />
          </div>

          <h2>Submissions - Last 30 Days</h2>
          {data.submissionsOverTime.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No submissions in this window yet.</p>
          )}
          {data.submissionsOverTime.length > 0 &&
            (() => {
              const max = Math.max(...data.submissionsOverTime.map((d) => d.count));
              return data.submissionsOverTime.map((d) => (
                <Bar key={d.date} label={d.date} value={d.count} max={max} />
              ));
            })()}

          <h2>Language Popularity</h2>
          {data.languagePopularity.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No submissions yet.</p>
          )}
          {data.languagePopularity.length > 0 &&
            (() => {
              const max = Math.max(...data.languagePopularity.map((l) => l.count));
              return data.languagePopularity.map((l) => (
                <Bar key={l.language} label={l.language} value={l.count} max={max} />
              ));
            })()}

          <h2>Verdict Breakdown</h2>
          {data.statusBreakdown.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No submissions yet.</p>
          )}
          {data.statusBreakdown.length > 0 &&
            (() => {
              const max = Math.max(...data.statusBreakdown.map((s) => s.count));
              return data.statusBreakdown.map((s) => (
                <Bar key={s.status} label={s.status} value={s.count} max={max} />
              ));
            })()}
        </>
      )}
    </div>
  );
};

export default Analytics;