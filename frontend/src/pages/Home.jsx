import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProblems } from '../store/slices/problemsSlice';
import { login, signup, logout } from '../store/slices/authSlice';

const Home = () => {
  const dispatch = useDispatch();
  const { list, status } = useSelector((state) => state.problems);
  const { user, error: authError } = useSelector((state) => state.auth);

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>Online Judge</h1>

      {user ? (
        <div>
          <p>Signed in as <strong>{user.username}</strong> ({user.role})</p>
          <button onClick={() => dispatch(logout())}>Log out</button>
        </div>
      ) : (
        <div style={{ border: '1px solid #ccc', padding: 16, marginBottom: 24 }}>
          <div>
            <button onClick={() => setMode('login')} disabled={mode === 'login'}>Login</button>
            <button onClick={() => setMode('signup')} disabled={mode === 'signup'}>Sign Up</button>
          </div>
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <input placeholder="Username" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                <input placeholder="Full Name" value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </>
            )}
            <input type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input type="password" placeholder="Password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button type="submit">{mode === 'login' ? 'Log In' : 'Sign Up'}</button>
          </form>
          {authError && <p style={{ color: 'red' }}>{authError}</p>}
        </div>
      )}

      <h2>Problems</h2>
      {status === 'loading' && <p>Loading...</p>}
      <ul>
        {list.map((p) => (
          <li key={p._id}>
            <Link to={`/problems/${p.code}`}>{p.name}</Link> — {p.difficulty}
            {p.isPractice && ' (Practice)'}
          </li>
        ))}
      </ul>

      <Link to="/leaderboard">View Leaderboard</Link>
    </div>
  );
};

export default Home;