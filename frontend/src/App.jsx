import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProblemDetail from './pages/ProblemDetail';
import Leaderboard from './pages/Leaderboard';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/problems/:code" element={<ProblemDetail />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/analytics" element={<Analytics />} />
    </Routes>
  );
}

export default App;