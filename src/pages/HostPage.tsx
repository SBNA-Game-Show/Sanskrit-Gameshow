import React, { useState } from 'react';
import socket from '../utils/socket';

const HostPage: React.FC = () => {
  const [gameId, setGameId] = useState('');
  const [question, setQuestion] = useState('');

  const createGame = () => {
    const id = prompt('Enter Game ID') || `GAME-${Date.now()}`;
    setGameId(id);
    socket.emit('create_game', { gameId: id, hostName: 'Host' });
  };

  const startQuestion = () => {
    if (!question || !gameId) return alert('Set question and Game ID');
    socket.emit('start_question', { gameId, question });
    setQuestion('');
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">🎮 Host Panel</h2>
      <button onClick={createGame} className="bg-green-500 text-white px-4 py-2 rounded">Create Game</button>
      <div className="mt-6">
        <input
          type="text"
          placeholder="Enter Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="border p-2 w-full"
        />
        <button onClick={startQuestion} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
          Send Question
        </button>
      </div>
    </div>
  );
};

export default HostPage;