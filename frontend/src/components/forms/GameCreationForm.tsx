import { Link } from "react-router-dom";
import AnimatedCard from "../common/AnimatedCard";
import Button from "../common/Button";
import Input from "../common/Input";
import { ROUTES } from "../../utils/constants";
import React, { useMemo } from "react";


interface GameCreationFormProps {
  team1Name: string;
  team2Name: string;
  onTeam1Change: (value: string) => void;
  onTeam2Change: (value: string) => void;
  onCreateGame: () => void;
  isLoading: boolean;
}

const GameCreationForm: React.FC<GameCreationFormProps> = ({
  team1Name,
  team2Name,
  onTeam1Change,
  onTeam2Change,
  onCreateGame,
  isLoading,
}) => {
    // Check if names are identical (case-insensitive)
  const duplicateNames = useMemo(() => {
    return team1Name.trim().toLowerCase() === team2Name.trim().toLowerCase();
  }, [team1Name, team2Name]);

  return (
    <AnimatedCard>
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 text-center">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4 flex items-center justify-center text-white text-4xl">
              🎯
            </div>
            <p className="text-lg text-slate-300 mb-4">
              Ready to host a buzzer-based quiz competition?
            </p>
            <p className="text-slate-400">
              Enter team names below and create a new game
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <Input
              testid="host-team1-input"
              id="team1"
              label="Team 1 Name"
              value={team1Name}
              onChange={(e) => onTeam1Change(e.target.value)}
              placeholder="Enter first team name"
              disabled={isLoading}
            />
            <Input
              testid="host-team2-input"
              id="team2"
              label="Team 2 Name"
              value={team2Name}
              onChange={(e) => onTeam2Change(e.target.value)}
              placeholder="Enter second team name"
              disabled={isLoading}
            />
          </div>

          {duplicateNames && (
  <p className="text-red-400 mb-4 text-sm">
    Team names must be different
  </p>
)}

<Button
  testid="host-create-game-button"
  onClick={onCreateGame}
  disabled={isLoading || !team1Name.trim() || !team2Name.trim() || duplicateNames}
  variant="primary"
  size="xl"
  loading={isLoading}
   className="!bg-gradient-to-r !from-orange-600 !to-orange-300 hover:!from-orange-600 hover:!to-orange-700 text-white shadow-lg border border-orange-700"
  icon={!isLoading ? <span className="text-2xl">🚀</span> : undefined}
>
  {isLoading ? "Creating..." : "CREATE GAME"}
</Button>


          <div className="mt-6">
            <Link
              to={ROUTES.HOSTHOME}
              className="!text-orange-600 !font-bold hover:!text-orange-500 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default GameCreationForm;
