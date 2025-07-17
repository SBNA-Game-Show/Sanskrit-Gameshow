import React from "react";
import { Player, Team } from "../../types";
import AnimatedCard from "../common/AnimatedCard";
import StatusIndicator from "../common/StatusIndicator";

interface PlayerListProps {
  players: Player[];
  teams: Team[];
  currentPlayerId?: string;
  variant?: "waiting" | "game";
  onAssignTeam?: (playerId: string, teamId: string) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  teams,
  currentPlayerId,
  variant = "waiting",
  onAssignTeam,
}) => {
  if (variant === "game") {
    return (
      <div className="glass-card p-3 mt-4">
        <h4 className="text-sm font-semibold text-center mb-3 text-slate-300">
          Team Scores
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {teams.map((team) => (
            <div
              key={`team-${team.id}`}
              className={`p-2 rounded text-center text-sm ${
                team.active
                  ? "bg-green-600/20 border border-green-400/30"
                  : "bg-slate-600/20"
              }`}
            >
              <div className="font-semibold">{team.name}</div>
              <div className="text-lg font-bold">{team.score}</div>
             
                
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AnimatedCard delay={200}>
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">
          Connected Players ({players.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {players.map((player) => (
            <div
              key={`player-${player.id}`}
              className={`glass-card p-3 text-center ${
                player.id === currentPlayerId
                  ? "border-yellow-400/50 bg-yellow-400/10"
                  : ""
              }`}
            >
              <StatusIndicator type="connected" />
              <div className="font-semibold">{player.name}</div>
              {player.id === currentPlayerId && (
                <span className="text-yellow-400 ml-1">👤</span>
              )}

              <div className="text-xs mt-1 text-blue-300">
                {player.teamId
                  ? `Team: ${
                      teams.find((t) => t.id === player.teamId)?.name || "Unknown"
                    }`
                  : "Unassigned"}
              </div>

              {variant === "waiting" && onAssignTeam && (
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {teams.map((team) => (
                    <button
                      key={`assign-${player.id}-${team.id}`}
                      onClick={() => onAssignTeam(player.id, team.id)}
                      className={`px-3 py-1 text-sm rounded-md font-medium ${
                        player.teamId === team.id
                          ? "bg-green-600 text-white"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AnimatedCard>
  );
};

export default PlayerList;
