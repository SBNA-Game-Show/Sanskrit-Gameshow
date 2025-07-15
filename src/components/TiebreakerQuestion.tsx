import React, { useState } from 'react';

interface Props {
  team: 'teamA' | 'teamB';
  onSubmit: (team: 'teamA' | 'teamB', answer: string) => void;
  disabled: boolean;
}

const TiebreakerQuestion: React.FC<Props> = ({ team, onSubmit, disabled }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(team, answer.trim());
      setAnswer('');
    }
  };

  return (
    <div className="bg-white shadow-md rounded p-6 dark:bg-gray-800">
      <h4 className="text-lg font-semibold mb-2">
        {team === 'teamA' ? 'Team A' : 'Team B'}
      </h4>
      <input
        type="text"
        placeholder="Your answer..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2 mb-2 border rounded"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Submit
      </button>
    </div>
  );
};

export default TiebreakerQuestion;
