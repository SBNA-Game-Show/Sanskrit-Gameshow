import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AnswerInput from '../AnswerInput';
import { MemoryRouter } from "react-router-dom";
import { act } from 'react';

// Test suite for AnswerInput
// Checks rendering of input, change, and submit button state

describe('AnswerInput', () => {
  it('renders input and submit button when isMyTeam is true', () => {
    const onAnswerChange = jest.fn();
    const onSubmit = jest.fn();
    render(
      <AnswerInput
        answer="test"
        onAnswerChange={onAnswerChange}
        onSubmit={onSubmit}
        canSubmit={true}
        isMyTeam={true}
      />
    );
    // Input should be present
    expect(screen.getByPlaceholderText(/enter your answer/i)).toBeInTheDocument();
    // Button should be present
    expect(screen.getByRole('button', { name: /submit answer/i })).toBeInTheDocument();
    // Simulate input change
    fireEvent.change(screen.getByPlaceholderText(/enter your answer/i), { target: { value: 'new' } });
    expect(onAnswerChange).toHaveBeenCalled();
    // Simulate submit
    fireEvent.click(screen.getByRole('button', { name: /submit answer/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('disables input and button when canSubmit is false', () => {
    render(
      <AnswerInput
        answer=""
        onAnswerChange={() => {}}
        onSubmit={() => {}}
        canSubmit={false}
        isMyTeam={true}
      />
    );
    expect(screen.getByPlaceholderText(/enter your answer/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /submit answer/i })).toBeDisabled();
  });
}); 