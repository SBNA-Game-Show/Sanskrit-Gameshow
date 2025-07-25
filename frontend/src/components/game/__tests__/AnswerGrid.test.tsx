import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AnswerGrid from '../AnswerGrid';

const answers = [
  { id: 1, text: 'Apple', points: 10, revealed: true },
  { id: 2, text: 'Banana', points: 5, revealed: false },
  { id: 3, text: 'Cherry', points: 3, revealed: false },
];

describe('AnswerGrid', () => {
  it('renders revealed and hidden answers', () => {
    render(<AnswerGrid answers={answers} currentRound={1} />);
    expect(screen.getByText(/Apple/)).toBeInTheDocument();
    const hiddenAnswers = screen.getAllByText('?');
    expect(hiddenAnswers.length).toBeGreaterThan(0);
  });

  it('calls onRevealAnswer when host clicks unrevealed answer', () => {
    const onRevealAnswer = jest.fn();

    render(
      <AnswerGrid
        answers={answers}
        currentRound={1}
        isHost={true}
        onRevealAnswer={onRevealAnswer}
      />
    );

    const unrevealedAnswer = screen.getByText((content, element) => {
      if (!element) return false;
      return (
        content.includes('Banana') &&
        element.textContent?.includes('(Click to reveal)') === true
      );
    });

    fireEvent.click(unrevealedAnswer.closest('.glass-card')!);
    expect(onRevealAnswer).toHaveBeenCalled();
  });
});
