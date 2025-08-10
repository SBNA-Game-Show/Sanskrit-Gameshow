import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/index.css";

// Import pages
import JoinGamePage from "./pages/JoinGamePage";
import HostGamePage from "./pages/HostGamePage";
import PlayerHomePage from "./pages/PlayerHomePage";
import LoginPage from "./pages/Login";
import HostHomePage from "./pages/HostHomePage";
import AudienceGamePage from "./pages/AudienceGamePage";
import HostRejoinPage from "./pages/HostRejoinPage";
import RegisterPage from "./pages/Register";
// Import constants
import { ROUTES } from "./utils/constants";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.HOSTHOME} element={<HostHomePage />} />
        <Route path={ROUTES.PLAYERHOME} element={<PlayerHomePage />} />
        <Route path={ROUTES.HOST} element={<HostGamePage />} />
        <Route path={ROUTES.HOSTREJOIN} element={<HostRejoinPage />} />
        <Route path={ROUTES.JOIN} element={<JoinGamePage />} />
        <Route path={ROUTES.AUDIENCE} element={<AudienceGamePage />} />
      </Routes>
    </Router>
  );
};

export default App;
