import React from 'react';
import { render, screen } from '@testing-library/react';
import QuestionCard from '../QuestionCard';
import { Question } from '../../../types';
import { MemoryRouter } from "react-router-dom";
import { act } from 'react';
// Test suite for QuestionCard
// Checks rendering of question, round, and category

describe('QuestionCard', () => {
  const question: Question = {
    id: 1,
    round: 1,
    teamAssignment: 'team1',
    questionNumber: 1,
    category: 'General',
    question: 'What is the capital of India?',
    answers: [],
  };

  it('renders question and round/category info', () => {
    render(
      <QuestionCard
        question={question}
        currentRound={1}
        questionIndex={0}
        totalQuestions={3}
      />
    );
    expect(screen.getByText(/What is the capital of India/)).toBeInTheDocument();
    expect(screen.getByText(/Round 1/)).toBeInTheDocument();
    expect(screen.getByText(/General/)).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 3/)).toBeInTheDocument();
  });
}); 