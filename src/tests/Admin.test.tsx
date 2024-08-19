import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, Mock } from 'vitest';
import { mockNavigate } from '../setupTests';
import AdminDashboard from '../components/AdminDashboard/AdminDashboard';
import Invite from '../pages/Invite/Invite';
import { BrowserRouter } from 'react-router-dom';
import { useAuth, AuthProvider } from '../Context';
import { mockAdminUserContext, currDate } from './data';
import { inviteUser } from '../utils/auth';

vi.mock('../Context', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../utils/auth', () => ({
  inviteUser: vi.fn(),
  isUnswEmail: vi.fn(),
}));

describe('Invite Component', () => {
  beforeEach(() => {
    (useAuth as Mock).mockReturnValue({ userContext: mockAdminUserContext });
    mockNavigate.mockClear();

    render(
      <AuthProvider>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </AuthProvider>
    );
  });

  it('dashboard correctly for an admin', () => {
    expect(screen.getByText(currDate)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
  });

  it('navigates to the invites page when clicking on add button on dashboard', () => {
    const inviteButton = screen.getByRole('button');
    fireEvent.click(inviteButton);
    expect(mockNavigate).toHaveBeenCalledWith('/invite');
  });

  it('adds a new member invite row on click for admins', () => {
    render(<Invite />);
    const addButton = screen.getByText('Add member');
    fireEvent.click(addButton);
    expect(screen.getAllByText('Email address').length).toBe(2);
  });

  it('checks appropriate error shows up on inviting an invalid UNSW email', () => {
    (inviteUser as Mock).mockResolvedValue({});
    render(<Invite />);

    // Invalid UNSW email - this will fail
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'z5888888' } });
    const sendButton = screen.getByText('Send invite');
    fireEvent.click(sendButton);
    expect(screen.getByText('All emails must be a valid UNSW email')).toBeInTheDocument();

    // Changing the email input to a valid one
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'z5888888@unsw.com' } });

    // Trying to send again will succeed
    const sendButtonAgain = screen.getByText('Send invite');
    fireEvent.click(sendButtonAgain);
  });

  // Check that no more than 5 members can be invited at a time
  it.skip('shows an alert for exceeding the maximum number of members', () => {
    render(<Invite />);
    const addButton = screen.getByText('Add another member');
    for (let i = 0; i < 5; i++) {
      fireEvent.click(addButton);
    }
    fireEvent.click(addButton);
    expect(screen.getByText('Can only invite up to 5 members at a time.')).toBeInTheDocument();
  });
});
