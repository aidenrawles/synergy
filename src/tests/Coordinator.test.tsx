import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CoordinatorDashboard from '../components/CoordinatorDashboard/CoordinatorDashboard';
import { useAuth, AuthProvider } from '../Context';
import { mockNavigate } from '../setupTests';
import { getAlgorithmLastRun, runAllocationAlgorithm } from '../utils/helper/algorithmHelper';
import { fetchClassData } from '../utils/helper/utilityHelper';
import { generateAllocationReport } from '../utils/helper/reportHelper';
import { mockCoordinatorUserContext, currDate, mockProjects } from './data';
import { getProjects } from '../utils/helper/projectHelper';

describe('Coordinator', () => {
  beforeEach(() => {
    vi.mock('../Context.tsx', () => ({
      useAuth: vi.fn(),
      AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }));

    vi.mock('../utils/helper/algorithmHelper', () => ({
      getAlgorithmLastRun: vi.fn(),
      runAllocationAlgorithm: vi.fn(),
    }));

    vi.mock('../utils/helper/reportHelper', () => ({
      generateAllocationReport: vi.fn(),
    }));

    vi.mock('../utils/helper/utilityHelper', () => ({
      fetchClassData: vi.fn(),
    }));

    vi.mock('../utils/helper/projectHelper', () => ({
      getProjects: vi.fn(),
    }));

    (useAuth as Mock).mockReturnValue({ userContext: mockCoordinatorUserContext });
    (getAlgorithmLastRun as Mock).mockResolvedValue('2023-01-01T00:00:00.000Z');
    (runAllocationAlgorithm as Mock).mockResolvedValue('2023-01-01T00:00:00.000Z');
    (fetchClassData as Mock).mockResolvedValue({ COMP3900: ['T01A', 'T02A'] });
    (getProjects as Mock).mockResolvedValue(mockProjects);

    (useAuth as Mock).mockClear();
    (getAlgorithmLastRun as Mock).mockClear();
    (runAllocationAlgorithm as Mock).mockClear();
    (fetchClassData as Mock).mockClear();
    mockNavigate.mockClear();

    act(() => {
      render(
        <AuthProvider>
          <BrowserRouter>
            <CoordinatorDashboard />
          </BrowserRouter>
        </AuthProvider>
      );
    });
  });

  it('renders component and displays welcome header', () => {
    expect(screen.getByText(currDate)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
  });

  it('fetches and displays last run time', async () => {
    await waitFor(() => {
      expect(getAlgorithmLastRun).toHaveBeenCalled();
    });

    expect(screen.getByText(/Last Run: 2023-01-01T00:00:00.000Z/i)).toBeInTheDocument();
  });

  it('fetches class data when Fetch Class Data is clicked', async () => {
    fireEvent.click(screen.getByText('Fetch Class Data'));

    await waitFor(() => {
      expect(fetchClassData).toHaveBeenCalled();
    });
  });

  it('generates report when button is clicked', async () => {
    fireEvent.click(screen.getByText('Generate Report'));
    await waitFor(() => {
      expect(generateAllocationReport).toHaveBeenCalled();
    });
  });

  it('navigates to allocations when view all groups is clicked', async () => {
    fireEvent.click(screen.getByText('View all groups'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/allocations');
    });
  });
});
