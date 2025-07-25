import React from 'react';
import { render, screen } from '@testing-library/react';
import Logo from '../Logo';

describe('Logo', () => {
  it('renders main title and subtitle', () => {
    render(<Logo />);
    expect(screen.getByText('Sanskrit Shabd Samvad')).toBeInTheDocument();
    expect(screen.getByText('Interactive Team Quiz Game')).toBeInTheDocument();
  });
}); 