import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BuzzerDisplay from '../BuzzerDisplay';

describe('BuzzerDisplay', () => {
  it('renders open buzzer state', () => {
    render(<BuzzerDisplay />);
    expect(screen.getByText(/Buzzer is open/i)).toBeInTheDocument();
  });

  it('renders current buzzer player name', () => {
    render(
      <BuzzerDisplay
        currentBuzzer={{ playerName: 'Alice', teamName: 'Red', timestamp: Date.now() }}
      />
    );
    expect(screen.getByText(/Alice buzzed in/i)).toBeInTheDocument();
    expect(screen.getByText(/Team: Red/)).toBeInTheDocument();
  });

  it('calls host controls when buttons are clicked', () => {
    const onCorrect = jest.fn();
    const onIncorrect = jest.fn();
    const onNext = jest.fn();
    render(
      <BuzzerDisplay
        isHost
        currentBuzzer={{ playerName: 'Alice', teamName: 'Red', timestamp: Date.now() }}
        onCorrectAnswer={onCorrect}
        onIncorrectAnswer={onIncorrect}
        onNextQuestion={onNext}
      />
    );

    fireEvent.click(screen.getByText('✓ Correct'));
    fireEvent.click(screen.getByText('✗ Incorrect'));
    fireEvent.click(screen.getByText('Next Question'));

    expect(onCorrect).toHaveBeenCalled();
    expect(onIncorrect).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });
});
