import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import socket from '../api/socket';

const Leaderboard = () => {
  const { list: problems } = useSelector((state) => state.problems);
  const [selectedCode, setSelectedCode] = useState('');
  const [entries, setEntries] = useState([]);

  // Derived during render instead of via an effect + setState, so we avoid
  // the extra cascading render that a synchronous setState-in-effect causes.
  const effectiveSelectedCode = selectedCode || (problems.length > 0 ? problems[0].code : '');

  useEffect(() => {
    if (!effectiveSelectedCode) return;
    api.get(`/submissions/leaderboard/${effectiveSelectedCode}`).then((res) => setEntries(res.data));
    socket.emit('join:leaderboard', effectiveSelectedCode);
    return () => {
      socket.emit('leave:leaderboard', effectiveSelectedCode);
    };
  }, [effectiveSelectedCode]);

  useEffect(() => {
    if (!effectiveSelectedCode) return;

    const handleLeaderboardUpdate = (payload) => {
      if (payload.problemCode !== effectiveSelectedCode) return;
      setEntries((prev) => {
        const withoutDuplicate = prev.filter((e) => e._id !== payload.entry._id);
        return [...withoutDuplicate, payload.entry]
          .sort((a, b) => a.executionTimeMs - b.executionTimeMs)
          .slice(0, 20);
      });
    };

    const handleReconnect = () => {
      socket.emit('join:leaderboard', effectiveSelectedCode);
    };

    socket.on('leaderboard:update', handleLeaderboardUpdate);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('leaderboard:update', handleLeaderboardUpdate);
      socket.off('connect', handleReconnect);
    };
  }, [effectiveSelectedCode]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <Link to="/">&larr; Back to problems</Link>
      <h1>Leaderboard</h1>

      <select value={effectiveSelectedCode} onChange={(e) => setSelectedCode(e.target.value)}>
        {problems.map((p) => (
          <option key={p._id} value={p.code}>{p.name}</option>
        ))}
      </select>

      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Rank</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>User</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Time (ms)</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={e._id}>
              <td>{i + 1}</td>
              <td>{e.user?.username}</td>
              <td>{e.executionTimeMs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
