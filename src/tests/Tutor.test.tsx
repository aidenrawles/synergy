import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { mockNavigate } from '../setupTests';
import { BrowserRouter } from 'react-router-dom';
import TutorDashboard from '../components/TutorDashboard/TutorDashboard';
import Invite from '../pages/Invite/Invite';
import { useAuth, AuthProvider } from '../Context';
import { mockTutorUserContext, currDate } from './data';

describe('TutorDashboard', () => {
  beforeEach(() => {
    vi.mock('../Context.tsx', () => ({
      useAuth: vi.fn(),
      AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }));

    (useAuth as Mock).mockReturnValue({ userContext: mockTutorUserContext });

    (useAuth as Mock).mockClear();

    act(() => {
      render(
        <AuthProvider>
          <BrowserRouter>
            <TutorDashboard />
          </BrowserRouter>
        </AuthProvider>
      );
    });
  });

  it('renders component and displays welcome header', () => {
    expect(screen.getByText(currDate)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByText(`Welcome back, ${mockTutorUserContext.firstName}`)).toBeInTheDocument();
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
});
