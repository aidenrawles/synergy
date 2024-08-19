import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import StudentDashboard from '../components/StudentDashboard/StudentDashboard';
import StudentGroups from '../components/StudentGroups/StudentGroups';
import { useAuth, AuthProvider } from '../Context';
import { mockNavigate } from '../setupTests';
import { mockStudentUserContext, currDate, mockGroups } from './data';
import { fetchGroupMembers, getAllGroups, getGroupIdWithUserId } from '../utils/helper/groupHelper';

describe('StudentDashboard', () => {
  beforeEach(() => {
    vi.mock('../Context.tsx', () => ({
      useAuth: vi.fn(),
      AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }));

    vi.mock('../utils/helper/groupHelper', () => ({
      fetchGroupMembers: vi.fn(),
    }));

    vi.mock('../utils/helper/userHelper', () => ({
      getUserDataById: vi.fn(),
    }));

    (useAuth as Mock).mockReturnValue({ userContext: mockStudentUserContext });
    (fetchGroupMembers as Mock).mockResolvedValue({
      1: [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
      ],
      2: ['00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005'],
    });

    (useAuth as Mock).mockClear();
    (fetchGroupMembers as Mock).mockClear();
    mockNavigate.mockClear();

    act(() => {
      render(
        <AuthProvider>
          <BrowserRouter>
            <StudentDashboard />
          </BrowserRouter>
        </AuthProvider>
      );
    });
  });

  it('renders component and displays welcome header', async () => {
    await waitFor(() => expect(screen.getByText(currDate)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument());
  });

  it('updates checklist item when checkbox is clicked', async () => {
    await waitFor(() => expect(screen.getByLabelText('Update profile')).toBeInTheDocument());
    const checkbox = screen.getByLabelText('Update profile');
    fireEvent.click(checkbox);

    await waitFor(() => {
      const storedChecklist = localStorage.getItem('checklist');
      expect(storedChecklist).toContain('update_profile');
    });
  });

  it('navigates to the profile page when Update Profile is clicked', async () => {
    await waitFor(() => expect(screen.getByText('Update Profile')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Update Profile'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  it('opens groups page when clicked', async () => {
    await waitFor(() => expect(screen.getByText('Join a group')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Join a group'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/groups');
    });
  });
});

describe('StudentGroups', () => {
  beforeEach(() => {
    vi.mock('../Context.tsx', () => ({
      useAuth: vi.fn(),
      AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }));

    vi.mock('../utils/helper/groupHelper', () => ({
      fetchGroupMembers: vi.fn(),
      getAllGroups: vi.fn(),
      getGroupIdWithUserId: vi.fn(),
      getGroupWithId: vi.fn(),
      joinGroup: vi.fn(),
      leaveGroup: vi.fn(),
      removeGroup: vi.fn(),
    }));

    vi.mock('../utils/helper/notificationHelper', () => ({
      notifyGroupMembers: vi.fn(),
    }));

    vi.mock('../utils/helper/utilityHelper', () => ({
      getTutorialCodes: vi.fn(),
    }));

    (useAuth as Mock).mockReturnValue({ userContext: mockStudentUserContext });
    (fetchGroupMembers as Mock).mockResolvedValue({
      1: [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
      ],
      2: ['00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005'],
    });
    (getAllGroups as Mock).mockResolvedValue(mockGroups);
    (getGroupIdWithUserId as Mock).mockResolvedValue({ group_id: 1 });

    (useAuth as Mock).mockClear();
    (fetchGroupMembers as Mock).mockClear();
    (getAllGroups as Mock).mockClear();
    mockNavigate.mockClear();

    act(() => {
      render(
        <AuthProvider>
          <BrowserRouter>
            <StudentGroups />
          </BrowserRouter>
        </AuthProvider>
      );
    });
  });

  it('renders component and displays header', () => {
    expect(screen.getByRole('heading', { name: /Available Groups/i })).toBeInTheDocument();
  });

  it('fetches and displays groups', async () => {
    await waitFor(() => {
      mockGroups.forEach((group) => {
        expect(screen.getByText(group.name)).toBeInTheDocument();
      });
    });
  });

  it('opens create group modal when Create a Group button is clicked', async () => {
    fireEvent.click(screen.getByText('Create a Group'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
