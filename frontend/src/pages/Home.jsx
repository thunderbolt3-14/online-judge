import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProblems } from '../store/slices/problemsSlice';
import { login, signup, logout } from '../store/slices/authSlice';

const difficultyClass = (d) => (d || '').toLowerCase();

const Home = () => {
  const dispatch = useDispatch();
  const { list, status } = useSelector((state) => state.problems);
  const { user, error: authError } = useSelector((state) => state.auth);

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });

  useEffect(() => {
    dispatch(fetchProblems());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      dispatch(login({ email: form.email, password: form.password }));
    } else {
      dispatch(signup(form));
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>
        &gt; online-judge
      </div>
      <h1>Problems</h1>

      {user ? (
        <div className="card" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            signed in as <strong style={{ color: 'var(--accent-action)' }}>{user.username}</strong>
            <span style={{ color: 'var(--text-muted)' }}> ({user.role})</span>
          </span>
          <button className="secondary" onClick={() => dispatch(logout())}>Log out</button>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button
              className={mode === 'login' ? '' : 'secondary'}
              onClick={() => setMode('login')}
            >
              Log in
            </button>
            <button
              className={mode === 'signup' ? '' : 'secondary'}
              onClick={() => setMode('signup')}
            >
              Sign up
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            {mode === 'signup' && (
              <>
                <input placeholder="Username" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                <input placeholder="Full name" value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </>
            )}
            <input type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input type="password" placeholder="Password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button type="submit">{mode === 'login' ? 'Log in' : 'Create account'}</button>
          </form>
          {authError && <p style={{ color: 'var(--verdict-error)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{authError}</p>}
        </div>
      )}

      {status === 'loading' && <p style={{ color: 'var(--text-muted)' }}>Loading problems…</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((p) => (
          <Link
            key={p._id}
            to={`/problems/${p.code}`}
            className="card"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-primary)' }}
          >
            <span>{p.name}{p.isPractice && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> · practice</span>}</span>
            <span className={`tag ${difficultyClass(p.difficulty)}`}>{p.difficulty}</span>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <Link to="/leaderboard">View leaderboard →</Link>
      </div>
    </div>
  );
};

export default Home;