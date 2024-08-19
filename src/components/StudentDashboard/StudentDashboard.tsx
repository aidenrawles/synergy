import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../config/supabaseClient.ts';
import { useAuth } from '../../Context.tsx';
import Button from '../Button/Button.tsx';
import ProgressBar from '../ProgressBar/ProgressBar.tsx';
import MemberAvatar from '../MemberAvatar/MemberAvatar';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import AlertSlider from '../AlertSlider/AlertSlider.tsx';
import styles from './StudentDashboard.module.scss';
import { Group, Allocation } from '../../types/database-types.ts';
import { fetchGroupMembers } from '../../utils/helper/groupHelper.ts';
import Loading from '../../pages/Loading/Loading.tsx';

interface Preference {
  group_id: number;
  project_id: string;
  preference_rank: number;
  projects: {
    title: string;
  } | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface Project {
  project_number: number;
  title: string;
  project_id: string;
  description: string;
}

interface AlertState {
  active: boolean;
  severity: 'error' | 'success' | 'info' | 'warning';
  errorMsg: string;
}

const initialChecklist: ChecklistItem[] = [
  { id: 'create_synergy_account', label: 'Create Synergy account', checked: true },
  { id: 'update_profile', label: 'Update profile', checked: false },
  { id: 'upload_transcript', label: 'Upload transcript', checked: false },
  { id: 'create_join_group', label: 'Create/join a group', checked: false },
  { id: 'select_preferences', label: 'Select project preferences', checked: false },
  { id: 'meet_team', label: 'Meet with team', checked: false },
];

const StudentDashboard: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    const storedChecklist = localStorage.getItem('checklist');
    return storedChecklist ? (JSON.parse(storedChecklist) as ChecklistItem[]) : initialChecklist;
  });
  const [groupMembers, setGroupMembers] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const { userContext } = useAuth();
  const navigate = useNavigate();
  const currDate = new Date();
  const [alert, setAlert] = useState<AlertState>({ active: false, severity: 'error', errorMsg: '' });

  const formattedCurrDate = currDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('project_number, title, project_id, description');

        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
        } else {
          const sortedProjects = (projectsData || []).sort((a, b) => a.project_number - b.project_number);
          setProjects(sortedProjects);
        }
      } catch (error) {
        console.error('Error in fetchProjects:', error);
      }
    };

    void fetchProjects();
  }, []);

  useEffect(() => {
    const fetchGroupsandAllocations = async () => {
      try {
        const { data: groupIdsData, error: groupIdsError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', userContext.id);

        if (groupIdsError) {
          console.error('Error fetching group IDs:', groupIdsError);
          return;
        }

        const groupIds = groupIdsData?.map((item) => item.group_id) || [];

        if (groupIds.length > 0) {
          const { data: groupsData, error: groupsError } = await supabase
            .from('groups')
            .select('group_id, name, description, capacity, members_count, project_number, tutorial')
            .in('group_id', groupIds);

          if (groupsError) {
            console.error('Error fetching groups:', groupsError);
          } else {
            setGroups(groupsData ? (groupsData as Group[]) : []);
          }

          const { data: allocationsData, error: allocationsError } = await supabase
            .from('allocations')
            .select('group_id, project_id')
            .in('group_id', groupIds);

          if (allocationsError) {
            console.error('Error fetching allocations:', allocationsError);
          } else {
            setAllocations(allocationsData ? (allocationsData as Allocation[]) : []);
          }

          const { data: preferencesData, error: preferencesError } = await supabase
            .from('group_preferences')
            .select('group_id, project_id, preference_rank, projects (title)')
            .in('group_id', groupIds);

          if (preferencesError) {
            console.error('Error fetching preferences:', preferencesError);
            return;
          }

          const preferencesWithTitle =
            preferencesData?.map((preference) => ({
              ...preference,
              project_title: preference.projects?.title ?? 'Unknown Project',
            })) || [];

          const initializedPreferences = Array.from({ length: 7 }, (_, index) => {
            const rank = index + 1;
            const existingPreference = preferencesWithTitle.find((pref) => pref.preference_rank === rank);
            return (
              existingPreference ?? {
                group_id: groups[0]?.group_id || 0,
                preference_rank: rank,
                project_id: '',
                project_title: '',
                projects: null,
              }
            );
          });

          setPreferences(initializedPreferences);
          const members = await fetchGroupMembers(groupIds);
          setGroupMembers(members);
        }
      } catch (error) {
        console.error('Error in fetchGroupsandAllocations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userContext?.id) {
      void fetchGroupsandAllocations();
    }
  }, [userContext?.id]);

  useEffect(() => {
    localStorage.setItem('checklist', JSON.stringify(checklist));
  }, [checklist]);

  const handleChecklistChange = (id: string) => {
    setChecklist((prevChecklist) =>
      prevChecklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handlePreferenceChange = (event: SelectChangeEvent, rank: number) => {
    const project_id = event.target.value;
    const existingPreference = preferences.find((pref) => pref.project_id === project_id);

    if (existingPreference) {
      setAlert({
        active: true,
        severity: 'error',
        errorMsg: `Project is already assigned to Preference ${existingPreference.preference_rank}`,
      });
      setTimeout(() => {
        setAlert({ active: false, severity: 'error', errorMsg: '' });
      }, 6000);
      return;
    }

    setPreferences((prevPreferences) =>
      prevPreferences.map((pref) =>
        pref.preference_rank === rank
          ? { ...pref, project_id, project_title: projects.find((p) => p.project_id === project_id)?.title ?? '' }
          : pref
      )
    );
  };

  const handleSavePreferences = async () => {
    try {
      const { data: existingPreferences, error: fetchError } = await supabase
        .from('group_preferences')
        .select('group_id, project_id, preference_rank')
        .eq('group_id', groups.length > 0 ? groups[0].group_id : '');

      if (fetchError) {
        console.error('Error fetching existing preferences:', fetchError);
        return;
      }

      const updatedPreferences = preferences
        .filter((pref) => pref.project_id)
        .map((pref) => ({
          group_id: groups.length > 0 ? groups[0].group_id : pref.group_id,
          project_id: pref.project_id,
          preference_rank: pref.preference_rank,
        }));

      for (const newPref of updatedPreferences) {
        const existingPref = existingPreferences.find(
          (existing) =>
            existing.preference_rank === newPref.preference_rank && existing.project_id !== newPref.project_id
        );

        if (existingPref) {
          const { error: deleteError } = await supabase
            .from('group_preferences')
            .delete()
            .match({ group_id: existingPref.group_id, preference_rank: existingPref.preference_rank });

          if (deleteError) {
            console.error('Error deleting existing preference:', deleteError);
            return;
          }
        }
      }

      const { error } = await supabase.from('group_preferences').upsert(updatedPreferences);

      if (error) {
        console.error('Error saving preferences:', error);
      } else {
        setAlert({
          active: true,
          severity: 'success',
          errorMsg: 'Preferences saved successfully',
        });
        setTimeout(() => {
          setAlert({ active: false, severity: 'success', errorMsg: '' });
        }, 6000);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const renderGroupCard = (group: Group, idx: number) => {
    const allocation = allocations.find((allocation) => allocation.group_id === group.group_id);

    if (allocation) {
      const project = projects.find((project) => project.project_id === allocation.project_id);

      if (project) {
        return (
          <div key={idx} className={styles.panelCard}>
            <h1>Allocation</h1>

            {group.tutorial === 'CONFLICT' ? (
              <h3 style={{ color: 'red' }}>Mismatch in tutorials or course</h3>
            ) : (
              <h3>Tutorial: {group.tutorial}</h3>
            )}
            <h3>
              Project {project.project_number} - {project.title}
            </h3>
            <p>{project.description}</p>
            <div className={styles.memberAvatars}>
              <h4></h4>
              <MemberAvatar ids={groupMembers[group.group_id] || []} />
            </div>
          </div>
        );
      }
    }

    return (
      <div key={idx} className={styles.panelCard}>
        <h1>{group.name}</h1>
        {group.tutorial === 'CONFLICT' ? (
          <h3 style={{ color: 'red' }}>Mismatch in tutorials or course</h3>
        ) : (
          <h3>Tutorial: {group.tutorial}</h3>
        )}
        <p>Group Description: {group.description}</p>
        <div className={styles.memberAvatars}>
          <h4>Group Members:</h4>
          <MemberAvatar ids={groupMembers[group.group_id] || []} />
        </div>
      </div>
    );
  };
  if (loading) {
    return <Loading />;
  }
  return (
    <div>
      <div className={styles.headerSection}>
        <div className={styles.headerText}>
          <h2 className={styles.date}>{formattedCurrDate}</h2>
          <h1 className={styles.header}>Welcome Back, {userContext?.firstName}</h1>
        </div>
        <Button
          label='Update Profile'
          labelColour='var(--primary-purple)'
          backgroundColour='var(--light-purple)'
          handleClick={() => navigate('/profile')}
        />
      </div>

      <ProgressBar setListItems={setChecklist} />
      <div className={styles.panelList}>
        <div className={styles.panelCard}>
          <h1>To Do</h1>
          <ul className={styles.todoList}>
            {checklist.map((item) => (
              <li key={item.id}>
                <input
                  type='checkbox'
                  id={item.id}
                  checked={item.checked}
                  onChange={() => handleChecklistChange(item.id)}
                />
                <label htmlFor={item.id}>{item.label}</label>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.panelCard}>
          <h1>Group preferences</h1>
          {groups.length === 0 ? (
            <div className={styles.noGroupContainer}>
              <Button
                label='Join a group'
                labelColour='var(--primary-purple)'
                backgroundColour='var(--light-purple)'
                handleClick={() => navigate('/groups')}
              />
            </div>
          ) : (
            <div className={styles.preferencesList}>
              {[1, 2, 3, 4, 5, 6, 7].map((rank) => (
                <FormControl fullWidth key={rank} className={styles.preferenceDropdown}>
                  <InputLabel>Preference {rank}</InputLabel>
                  <Select
                    value={preferences.find((pref) => pref.preference_rank === rank)?.project_id ?? ''}
                    label={`Preference ${rank}`}
                    onChange={(event) => handlePreferenceChange(event, rank)}>
                    {projects.map((project) => (
                      <MenuItem key={project.project_id} value={project.project_id}>
                        P{project.project_number} - {project.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </div>
          )}

          {groups.length > 0 && (
            <div className={styles.saveButtonContainer}>
              <Button
                label='Save Preferences'
                labelColour='var(--primary-purple)'
                backgroundColour='var(--light-purple)'
                handleClick={() => void handleSavePreferences()}
                className={styles.saveButton}
              />
            </div>
          )}
        </div>
        {groups.map(renderGroupCard)}
      </div>
      <AlertSlider active={alert.active} severity={alert.severity} errorMsg={alert.errorMsg} />
    </div>
  );
};

export default StudentDashboard;
