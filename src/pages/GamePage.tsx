import React, { useEffect, useState } from 'react';
import QuestionDisplay from '../components/QuestionDisplay';
import Scoreboard from '../components/Scoreboard';
import API from '../utils/api';

const GamePage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [scores, setScores] = useState({ teamA: 0, teamB: 0 });

  const fetchQuestion = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await API.get('/game/current', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const q = res.data;
      setQuestion(q.question); // ✅ use correct field
      localStorage.setItem('currentQ', q.id); // ✅ store the question ID
    } catch (err) {
      console.error('Error fetching question:', err);
    }
  };

  const fetchScores = async () => {
    try {
      const res = await API.get('/response/scores');
      setScores(res.data);
    } catch (err) {
      console.error('Error fetching scores:', err);
    }
  };

  const handleAnswerSubmit = async (answer: string) => {
    const questionId = localStorage.getItem('currentQ');
    const token = localStorage.getItem('token');

    if (!questionId || !token) {
      alert("Missing question or token. Please refresh the page.");
      return;
    }

    try {
      await API.post(
        '/response/submit',
        { questionId, answer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchScores();
    } catch (err) {
      console.error('Error submitting answer:', err);
      alert('Answer submission failed.');
    }
  };

  useEffect(() => {
    fetchQuestion();
    fetchScores();
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <Scoreboard scores={scores} />
      <QuestionDisplay question={question} onSubmit={handleAnswerSubmit} />
    </div>
  );
};

export default GamePage;
