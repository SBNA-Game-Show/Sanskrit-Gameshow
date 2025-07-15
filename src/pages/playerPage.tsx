import React, { useEffect, useState } from 'react';
import socket from '../utils/socket';

const PlayerPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState<any>({});

  const team = localStorage.getItem('role');
  const username = localStorage.getItem('username');
  const gameId = prompt('Enter Game ID to Join') || '';

  useEffect(() => {
    if (!username || !team) return;

    socket.emit('join_game', { gameId, team, username });

    socket.on('new_question', (data) => {
      setQuestion(data.question);
      setAnswer('');
      setSubmitted(false);
    });

    socket.on('score_update', (updatedScores) => {
      setScores(updatedScores);
    });

    return () => {
      socket.off('new_question');
      socket.off('score_update');
    };
  }, []);

  const submitAnswer = () => {
    socket.emit('submit_answer', {
      gameId,
      team,
      answer,
      points: Math.floor(Math.random() * 100),
    });
    setSubmitted(true);
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold">Welcome, {username} ({team})</h2>
      <h3 className="mt-4">Question: {question || 'Waiting for question...'}</h3>
      {question && !submitted && (
        <>
          <input
            className="border p-2 w-full mt-2"
            placeholder="Your answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button onClick={submitAnswer} className="mt-2 bg-purple-600 text-white px-4 py-2 rounded">
            Submit Answer
          </button>
        </>
      )}
      {submitted && <p className="mt-4 text-green-600">Answer submitted! Waiting for next question...</p>}

      <div className="mt-6">
        <h4 className="font-bold">Scores</h4>
        <pre>{JSON.stringify(scores, null, 2)}</pre>
      </div>
    </div>
  );
};

export default PlayerPage;
