import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CitationPill } from '../components/chat/CitationPill';

describe('CitationPill Component', () => {
  it('renders the correct page number label', () => {
    render(<CitationPill pageNumber={7} />);
    expect(screen.getByText('Page 7')).toBeInTheDocument();
  });

  it('triggers onClick with correct page number when clicked', () => {
    const handleClick = vi.fn();
    render(<CitationPill pageNumber={4} onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(4);
  });
});
