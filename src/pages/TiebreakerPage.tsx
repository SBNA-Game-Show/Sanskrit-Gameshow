// import React, { useEffect, useState } from 'react';
// import API from '../utils/api';
// import TiebreakerQuestion from '../components/TiebreakerQuestion';
// import Confetti from '../components/ConfettiWinner';

// const TiebreakerPage: React.FC = () => {
//   const [question, setQuestion] = useState('');
//   const [answers, setAnswers] = useState<{ teamA?: string; teamB?: string }>({});
//   const [winner, setWinner] = useState<string | null>(null);
//   const [answerPoints, setAnswerPoints] = useState<{ teamA: number; teamB: number }>({
//     teamA: 0,
//     teamB: 0,
//   });

//   const [questionId, setQuestionId] = useState('');

//   const fetchQuestion = async () => {
//     const token = localStorage.getItem('token');
//     try {
//       const res = await API.get('/game/current', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setQuestion(res.data.questionText);
//       setQuestionId(res.data.id);
//     } catch (err) {
//       console.error('Failed to load tiebreaker question');
//     }
//   };

//   const submitAnswer = async (team: 'teamA' | 'teamB', answer: string) => {
//     const token = localStorage.getItem('token');
//     try {
//       const res = await API.post(
//         '/response/submit',
//         { questionId, answer },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       const points = res.data.points || 0;

//       setAnswers((prev) => ({ ...prev, [team]: answer }));
//       setAnswerPoints((prev) => ({ ...prev, [team]: points }));

//       // When both teams have submitted
//       if (
//         (team === 'teamA' && answers.teamB !== undefined) ||
//         (team === 'teamB' && answers.teamA !== undefined)
//       ) {
//         const otherPoints =
//           team === 'teamA' ? answerPoints.teamB : answerPoints.teamA;
//         const currentPoints = points;

//         if (currentPoints > otherPoints) {
//           setWinner(team);
//         } else if (currentPoints < otherPoints) {
//           setWinner(team === 'teamA' ? 'teamB' : 'teamA');
//         } else {
//           setWinner('Tie'); // Optional
//         }
//       }
//     } catch (err) {
//       console.error('Error submitting answer:', err);
//       alert('Submission failed');
//     }
//   };

//   useEffect(() => {
//     fetchQuestion();
//   }, []);

//   return (
//     <div className="max-w-2xl mx-auto text-center mt-10">
//       <h2 className="text-2xl font-bold mb-4">🤝 Tiebreaker Round</h2>
//       <h3 className="text-lg font-semibold mb-6">{question}</h3>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <TiebreakerQuestion team="teamA" onSubmit={submitAnswer} disabled={!!answers.teamA} />
//         <TiebreakerQuestion team="teamB" onSubmit={submitAnswer} disabled={!!answers.teamB} />
//       </div>

//       {winner && (
//         <div className="mt-10 text-3xl font-bold text-green-600">
//           {winner === 'Tie' ? 'It’s a Tie!' : `🎉 ${winner.toUpperCase()} Wins!`}
//           <Confetti />
//         </div>
//       )}
//     </div>
//   );
// };

// export default TiebreakerPage;
import React, { useEffect, useState } from 'react';
import API from '../utils/api';

const TieBreakerPage: React.FC = () => {
  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [winner, setWinner] = useState<any>(null);

  const team = localStorage.getItem('role'); // teamA or teamB
  const token = localStorage.getItem('token');

  const fetchQuestion = async () => {
    const res = await API.get('/tiebreaker');
    setQuestion(res.data);
  };

  const submitAnswer = async () => {
    await API.post('/tiebreaker/submit', { team, answer }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSubmitted(true);
  };

  const checkResult = async () => {
    const res = await API.get('/tiebreaker/result');
    setWinner(res.data.winner);
  };

  useEffect(() => {
    fetchQuestion();
    const interval = setInterval(() => {
      if (submitted) checkResult();
    }, 3000);
    return () => clearInterval(interval);
  }, [submitted]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {question && !winner && (
        <>
          <h2 className="text-2xl font-bold">{question.questionText}</h2>
          <input
            className="border w-full p-2 mt-4"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitted}
          />
          {!submitted && (
            <button onClick={submitAnswer} className="mt-4 bg-orange-500 text-white px-4 py-2 rounded">
              Submit
            </button>
          )}
          {submitted && <p className="text-green-500 mt-4">Waiting for the result...</p>}
        </>
      )}

      {winner && (
        <div className="mt-6 p-4 bg-green-100 rounded shadow">
          <h2 className="text-xl font-bold text-green-700">🎉 Winner: {winner.team} 🎉</h2>
          <p className="mt-2">They answered: <strong>{winner.answer}</strong> (Score: {winner.score})</p>
        </div>
      )}
    </div>
  );
};

export default TieBreakerPage;
