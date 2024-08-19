import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { mockNavigate } from '../setupTests';
import ClientDashboard from '../components/ClientDashboard/ClientDashboard';
import { useAuth, AuthProvider } from '../Context';
import { mockProjects, mockClientUserContext, currDate } from './data';
import { getProjectsWithClientId } from '../utils/helper/projectHelper';

describe('ClientDashboard', () => {
  beforeEach(() => {
    // Mock call to useAuth
    vi.mock('../Context.tsx', () => ({
      useAuth: vi.fn(),
      AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }));

    // Mock call to the getProjectsWithClientId helper function
    vi.mock('../utils/helper/projectHelper', () => ({
      getProjectsWithClientId: vi.fn(),
    }));

    // Mocking the return values
    (useAuth as Mock).mockReturnValue({ userContext: mockClientUserContext });
    (getProjectsWithClientId as Mock).mockResolvedValue(mockProjects);

    // Clear mock value before eachtest
    (useAuth as Mock).mockClear();
    (getProjectsWithClientId as Mock).mockClear();
    mockNavigate.mockClear();

    // Render dashboard before each test
    act(() => {
      render(
        <AuthProvider>
          <BrowserRouter>
            <ClientDashboard />
          </BrowserRouter>
        </AuthProvider>
      );
    });
  });

  it('renders component (displays welcome header and projects list)', () => {
    expect(screen.getByText(currDate)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Projects managed:/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create new project/i })).toBeInTheDocument();
  });

  it('fetches and displays projects on dashboard', async () => {
    await act(async () => {
      await waitFor(() => {
        expect(getProjectsWithClientId).toHaveBeenCalledWith(mockClientUserContext.id);
      });

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument();
        expect(screen.getByText('Desc for project 1')).toBeInTheDocument();
        expect(screen.getByText('Project 2')).toBeInTheDocument();
        expect(screen.getByText('Desc for project 2')).toBeInTheDocument();
      });
    });
  });

  it('navigates to specific project page when clicked', async () => {
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Project 1'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/project/1');
    });
  });

  it('navigates to the create new project page when the button is clicked', async () => {
    fireEvent.click(screen.getByText('Create new project'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/project/new');
    });
  });
});
