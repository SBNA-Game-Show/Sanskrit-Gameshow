import React, { useState } from 'react';
import axios from 'axios';

interface Props {
  team: 'teamA' | 'teamB';
  questionId: string;
  questionText: string;
}

const QuestionResponse: React.FC<Props> = ({ team, questionId, questionText }) => {
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState<number | null>(null);

  const handleSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:5050/api/game/submit', {
        team,
        questionId,
        answer
      });
      setScore(res.data.score);
    } catch (err) {
      alert("Failed to submit answer");
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg max-w-md mx-auto mt-4">
      <h2 className="text-xl font-bold mb-2">{questionText}</h2>
      <input
        className="border p-2 w-full rounded"
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        placeholder="Enter your answer"
      />
      <button onClick={handleSubmit} className="mt-2 bg-blue-500 text-white p-2 rounded w-full">
        Submit
      </button>
      {score !== null && <p className="mt-2">✅ You scored: {score} points</p>}
    </div>
  );
};

export default QuestionResponse;
