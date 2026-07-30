import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProblemDetail from './pages/ProblemDetail';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/problems/:code" element={<ProblemDetail />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}

export default App;