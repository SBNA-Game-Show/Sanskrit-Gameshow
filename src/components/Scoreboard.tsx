import React from 'react';

interface Props {
  scores: {
    teamA: number;
    teamB: number;
  };
}

const Scoreboard: React.FC<Props> = ({ scores }) => (
  <div className="flex justify-around text-xl font-bold mt-4">
    <div>Team A: {scores.teamA}</div>
    <div>Team B: {scores.teamB}</div>
  </div>
);

export default Scoreboard;
