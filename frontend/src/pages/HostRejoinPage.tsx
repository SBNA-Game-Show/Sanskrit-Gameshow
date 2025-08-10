import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import HostJoinForm from "../components/forms/HostJoinForm";
import { ROUTES } from "../utils/constants";

const HostRejoinPage: React.FC = () => {
  const [gameCode, setGameCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!gameCode.trim()) return;
    setIsLoading(true);
    const code = gameCode.trim().toUpperCase();
    navigate(`${ROUTES.HOST}?code=${code}`);
  };

  return (
    <PageLayout>
      <HostJoinForm
        gameCode={gameCode}
        onGameCodeChange={setGameCode}
        onJoin={handleJoin}
        isLoading={isLoading}
      />
    </PageLayout>
  );
};

export default HostRejoinPage;
