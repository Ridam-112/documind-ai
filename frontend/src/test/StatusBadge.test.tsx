import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBadge } from '../components/documents/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders Ready status correctly', () => {
    render(<StatusBadge status="ready" />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('renders Extracting Pages status correctly', () => {
    render(<StatusBadge status="extracting" />);
    expect(screen.getByText('Extracting Pages')).toBeInTheDocument();
  });

  it('renders Generating Vectors status correctly', () => {
    render(<StatusBadge status="embedding" />);
    expect(screen.getByText('Generating Vectors')).toBeInTheDocument();
  });

  it('renders Failed status correctly', () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
