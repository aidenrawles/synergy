import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register/Register';
import { mockNavigate } from '../setupTests';
import supabase from '../config/supabaseClient';

vi.mock('./supabaseClient');

describe('Testing the register component', () => {
  beforeEach(() => {
    supabase.auth.signUp = vi.fn();
    mockNavigate.mockClear();
  });

  test('insuccessful, then successful register and login', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /Register/i })).toBeInTheDocument();

    // Fill out text fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Emily' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Liu' } });
    fireEvent.change(screen.getByLabelText(/zID/i), { target: { value: 'z5308855' } });
    fireEvent.change(screen.getByLabelText(/unsw email/i), { target: { value: 'z5308855@unsw.com.au' } });
    fireEvent.change(screen.getByLabelText('Password:'), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText('Confirm Password:'), { target: { value: '123456' } });

    // Click + choose course code
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /course code/i }));
    fireEvent.click(screen.getByRole('option', { name: /COMP3900/i }));

    // Click + choose tutorial code
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /tutorial code/i }));
    const tutOption = await screen.findByText('T11A');
    fireEvent.click(tutOption);

    (supabase.auth.signUp as Mock).mockResolvedValueOnce({
      user: {
        email: 'z5308855@unsw.com.au',
        password: '123456',
      },
      error: null,
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Should land on dashboard after registering succcessfully
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
