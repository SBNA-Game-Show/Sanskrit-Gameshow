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
}) => {
  const playerName = localStorage.getItem("username") || "Player";

  return (
    <div className="bg-white border shadow p-8 text-center mb-8">
      <h2 className="text-3xl font-bold mb-4">Welcome {playerName}!</h2>

      <div className="mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Choose your team
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team, index) => (
              <AnimatedCard key={team.id} delay={index * 100}>
                <button
                  onClick={() => onSelectTeam(team.id)}
                  data-testid={`join-team-${index+1}-button`}
                  disabled={team.id === selectedTeamId}
                  className={`w-full p-6 rounded-xl text-left transition-all transform ${
                    team.id === selectedTeamId
                      ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-500 shadow-lg shadow-green-500/20 cursor-default"
                      : "bg-gradient-to-br from-slate-800/50 to-slate-700/50 hover:from-slate-700/50 hover:to-slate-600/50 border-2 border-slate-600 hover:scale-105 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xl font-bold">{team.name}</h4>
                    {team.id === selectedTeamId && (
                      <span className="text-green-400 text-2xl animate-bounce">
                        ✓
                      </span>
                    )}
                  </div>
        
 
                </button>
              </AnimatedCard>
            ))}
          </div>
          
          {selectedTeamId && (
            <div className="mt-6 p-4  rounded-lg border border-blue-500/30 shadow bg-gray-100">
              <p className="text-blue-300 font-medium">
                You're on{" "}
                {teams.find((t) => t.id === selectedTeamId)?.name || "a team"}!
              </p>
              <p className="text-slate-400 text-sm mt-1">
                You can switch teams anytime before the game starts
              </p>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-slate-400 mt-4">
        Please select a team - the game cannot start until all players have chosen a team
      </p>
    </div>
  );
};

export default TeamSelection;