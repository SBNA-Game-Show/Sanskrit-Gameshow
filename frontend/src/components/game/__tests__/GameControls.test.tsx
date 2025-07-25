import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GameControls from '../GameControls';
import { MemoryRouter } from "react-router-dom";
import { act } from 'react';
describe('GameControls', () => {
  it('renders control buttons and handles clicks', () => {
    const onClearBuzzer = jest.fn();
    const onNextQuestion = jest.fn();
    render(
      <MemoryRouter>
        <GameControls onClearBuzzer={onClearBuzzer} onNextQuestion={onNextQuestion} />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /clear buzzer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next question/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear buzzer/i }));
    fireEvent.click(screen.getByRole('button', { name: /next question/i }));

    expect(onClearBuzzer).toHaveBeenCalled();
    expect(onNextQuestion).toHaveBeenCalled();
  });

  it('shows control message if provided', () => {
    render(
      <MemoryRouter>
        <GameControls onClearBuzzer={() => {}} onNextQuestion={() => {}} controlMessage="Test message" />
      </MemoryRouter>
    );
    expect(screen.getByText(/Test message/)).toBeInTheDocument();
  });
});
