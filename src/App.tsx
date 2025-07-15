import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import QuestionPage from "./pages/GamePage";
import TiebreakerPage from './pages/TiebreakerPage'
import HostPage from "./pages/HostPage";
import PlayerPage from "./pages/playerPage";
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Login/>} />
      <Route path="/question" element={<QuestionPage />} />
      <Route path="/TiebreakerPage" element={<TiebreakerPage />} />
      <Route path="/host" element={<HostPage />} />
      <Route path="/player" element={<PlayerPage />} />

      </Routes>
    </Router>
  );
};

export default App;
