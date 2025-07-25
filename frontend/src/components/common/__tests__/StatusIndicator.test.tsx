import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusIndicator from '../StatusIndicator';

describe('StatusIndicator', () => {
  it('renders active indicator', () => {
    const { container } = render(<StatusIndicator type="active" />);
    expect(container.querySelector('.team-active-indicator')).toBeInTheDocument();
  });

  it('renders waiting indicator', () => {
    const { container } = render(<StatusIndicator type="waiting" />);
    expect(container.querySelector('.team-waiting-indicator')).toBeInTheDocument();
  });

  it('renders connected indicator', () => {
    render(<StatusIndicator type="connected" />);
    expect(screen.getByText('●')).toBeInTheDocument();
  });

  it('renders team-status indicator (active)', () => {
    render(<StatusIndicator type="team-status" isActive />);
    expect(screen.getByText('Your Turn')).toBeInTheDocument();
  });

  it('renders team-status indicator (waiting)', () => {
    render(<StatusIndicator type="team-status" />);
    expect(screen.getByText('Waiting')).toBeInTheDocument();
  });
}); 