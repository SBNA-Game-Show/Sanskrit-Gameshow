import React from "react";
import { Team } from "../../types";
import AnimatedCard from "../common/AnimatedCard";

interface TeamSelectionProps {
  teams: Team[];
  selectedTeamId?: string;
  onSelectTeam: (teamId: string) => void;
  playerName: string;
}

const TeamSelection: React.FC<TeamSelectionProps> = ({
  teams,
  selectedTeamId,
  onSelectTeam,
  playerName,
}) => {
  const handleSelectTeam = (teamId: string) => {
    // Save team to localStorage for persistence
    localStorage.setItem("team", teamId);
    onSelectTeam(teamId);
  };

  return (
    <div className="glass-card p-8 text-center mb-8">
      <h2 className="text-3xl font-bold mb-4">Welcome {playerName}!</h2>

      <div className="mb-6">
        {!selectedTeamId ? (
          <div>
            <h3 className="text-xl font-semibold mb-4">Choose your team:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <AnimatedCard key={team.id}>
                  <button
                    onClick={() => handleSelectTeam(team.id)}
                    disabled={!!selectedTeamId} // Prevent reselection
                    className={`w-full p-6 rounded-lg text-left transition-all ${
                      team.id === selectedTeamId
                        ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-2 border-blue-500/50"
                        : "bg-slate-800/50 hover:bg-slate-700/50"
                    }`}
                  >
                    <h4 className="text-lg font-semibold">{team.name}</h4>
                    <p className="text-slate-400">
                      Members: {team.members.join(", ") || "No members yet"}
                    </p>
                  </button>
                </AnimatedCard>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
              <p className="text-green-300 font-medium">
                You've joined{" "}
                <strong>
                  {teams.find((t) => t.id === selectedTeamId)?.name || "your team"}
                </strong>
                !
              </p>
            </div>
            <p className="text-slate-400">
              Waiting for the host to start the game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSelection;
