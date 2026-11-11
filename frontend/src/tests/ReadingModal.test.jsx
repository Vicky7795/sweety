import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import ReadingModal from '../components/ReadingModal';

describe('ReadingModal Form Component', () => {
  test('displays validation error when glucose value is empty (RULE 1)', async () => {
    const handleSave = vi.fn();
    render(<ReadingModal isOpen={true} onClose={() => {}} onSave={handleSave} />);

    // Click submit with empty input
    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });

  test('displays validation error when glucose value is below 40 or above 600 (RULE 2)', async () => {
    const handleSave = vi.fn();
    render(<ReadingModal isOpen={true} onClose={() => {}} onSave={handleSave} />);

    const input = screen.getByPlaceholderText(/e\.g\. 110/i);
    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });

    // Test below 40
    fireEvent.change(input, { target: { value: '35' } });
    fireEvent.click(submitBtn);
    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();

    // Test above 600
    fireEvent.change(input, { target: { value: '650' } });
    fireEvent.click(submitBtn);
    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();

    expect(handleSave).not.toHaveBeenCalled();
  });

  test('calls onSave with valid integer glucose value and default slot', async () => {
    const handleSave = vi.fn().mockResolvedValue({});
    const handleClose = vi.fn();

    render(<ReadingModal isOpen={true} onClose={handleClose} onSave={handleSave} />);

    const input = screen.getByPlaceholderText(/e\.g\. 110/i);
    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });

    fireEvent.change(input, { target: { value: '125' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith({
        reading_date: expect.any(String),
        time_slot: 'Morning (fasting)',
        glucose_value: 125,
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
