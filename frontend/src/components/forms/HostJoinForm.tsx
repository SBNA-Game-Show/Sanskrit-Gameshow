import React from "react";
import { Link } from "react-router-dom";
import AnimatedCard from "../common/AnimatedCard";
import Button from "../common/Button";
import Input from "../common/Input";
import { ROUTES } from "../../utils/constants";

interface HostJoinFormProps {
  gameCode: string;
  onGameCodeChange: (value: string) => void;
  onJoin: () => void;
  isLoading: boolean;
  error?: string;
}

const HostJoinForm: React.FC<HostJoinFormProps> = ({
  gameCode,
  onGameCodeChange,
  onJoin,
  isLoading,
  error,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onJoin();
    }
  };

  return (
    <AnimatedCard>
      <div className="max-w-md mx-auto">
        <div className="glass-card p-8 text-center">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 mb-4 flex items-center justify-center text-white text-4xl">
              👑
            </div>
            <p className="text-lg text-slate-300 mb-4">Rejoin a game you're hosting</p>
          </div>
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300">
              {error}
            </div>
          )}
          <div className="space-y-4 mb-8">
            <Input
              id="hostGameCode"
              value={gameCode}
              onChange={(e) => onGameCodeChange(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="Enter 6-digit code"
              label="Game Code"
              variant="center"
              maxLength={6}
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={onJoin}
            disabled={isLoading || !gameCode.trim()}
            variant="primary"
            size="xl"
            loading={isLoading}
            icon={!isLoading ? <span className="text-2xl">🔄</span> : undefined}
            className="mb-6"
          >
            {isLoading ? "Joining..." : "REJOIN"}
          </Button>
          <div className="mt-6">
            <Link to={ROUTES.HOSTHOME} className="text-slate-400 hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default HostJoinForm;
