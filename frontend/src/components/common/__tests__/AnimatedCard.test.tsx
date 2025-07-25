import React from 'react';
import { render, screen } from '@testing-library/react';
import AnimatedCard from '../AnimatedCard';

describe('AnimatedCard', () => {
  it('renders children', () => {
    render(<AnimatedCard>Test Content</AnimatedCard>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies className and delay', () => {
    render(<AnimatedCard className="custom-class" delay={100}>Content</AnimatedCard>);
    const contentElement = screen.getByText('Content');
    const card = contentElement.closest('div');
    expect(card).toHaveClass('animated-card');
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveStyle({ animationDelay: '100ms' });
  });
});
