import React, { useState } from 'react';

interface Props {
  question: string;
  onSubmit: (answer: string) => void;
}

const QuestionDisplay: React.FC<Props> = ({ question, onSubmit }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md mt-8">
      <h2 className="text-xl font-bold mb-4">{question}</h2>
      <form onSubmit={handleSubmit} className="flex items-center gap-4">
      
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border px-4 py-2 rounded w-full"
          placeholder="Your answer..."
        />
        <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded">
          Submit
        </button>
      </form>
    </div>
  );
};

export default QuestionDisplay;
