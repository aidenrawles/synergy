import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Mock } from 'vitest';
import { mockNavigate } from '../setupTests';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login/Login';
import supabase from '../config/supabaseClient';

describe('Testing the login component', () => {
  beforeEach(() => {
    supabase.auth.signInWithPassword = vi.fn();
    mockNavigate.mockClear();
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  });

  it('checks that login form is rendered', () => {
    expect(screen.getByRole('heading', { name: /Log In/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
  });

  it('succesful login', async () => {
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });

    (supabase.auth.signInWithPassword as Mock).mockResolvedValue({
      user: {
        email: 'z5308855@unsw.com.au',
        password: '123456',
      },
      error: null,
    });

    fireEvent.click(screen.getByRole('button', { name: /Log In/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
