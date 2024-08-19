import React, { useState, useEffect } from 'react';
import styles from './ProjectStudents.module.scss';
import Dropdown from './Dropdown';
import supabase from '../../config/supabaseClient';
import { useAuth } from '../../Context';
import { Project } from '../../types/database-types';
import ProjectTag from '../../components/ProjectTag/ProjectTag';
import Button from '../../components/Button/Button';
import { Tags } from '../../types/database-types';
import { TAGS } from '../../utils/projectTag';
import ProjectModal from '../../components/ProjectModal/ProjectModal';
import ProjectSearch from '../../components/ProjectSearch/ProjectSearch';
import AlertSlider from '../AlertSlider/AlertSlider';
import { getProjects } from '../../utils/helper/projectHelper';
import Loading from '../../pages/Loading/Loading';

const ProjectStudents: React.FC = () => {
  const [ranks, setRanks] = useState<Record<string, number | undefined>>({});
  const [studentProjects, setStudentProjects] = useState<Project[]>([]);
  const { userContext, loggedIn } = useAuth();
  const [groupId, setGroupId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [alertState, setAlertState] = useState({
    active: false,
    severity: 'success' as 'success' | 'info' | 'warning' | 'error',
    errorMsg: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projects = await getProjects();
        if (!('error' in projects)) {
          const sortedData = projects.sort((a, b) => a.project_number - b.project_number);
          setStudentProjects(sortedData ? sortedData : []);
          setFilteredProjects(sortedData ? sortedData : []);

          const savedRanks = localStorage.getItem('projectRanks');
          if (savedRanks) {
            try {
              const parsedRanks = JSON.parse(savedRanks) as Record<string, number | undefined>;
              setRanks(parsedRanks);
            } catch (e) {
              console.error('Error parsing saved ranks:', e);
            }
          }
        } else {
          console.error('Error fetching projects:', projects.error);
          return;
        }
      } catch (error) {
        console.error('Error in fetchProjects:', error);
      } finally {
        setLoading(false);
      }
    };
    void fetchProjects();
  }, [userContext?.id]);

  useEffect(() => {
    const fetchSavedRanks = async (groupId: number) => {
      const { data, error } = await supabase
        .from('group_preferences')
        .select('project_id, preference_rank')
        .eq('group_id', groupId);

      if (error) {
        console.error('Error fetching saved ranks:', error);
        return;
      }

      if (data) {
        const savedRanks: Record<string, number> = {};
        data.forEach((item) => {
          const project = studentProjects.find((p) => p.project_id === item.project_id);
          if (project) {
            savedRanks[project.project_number.toString()] = item.preference_rank;
          }
        });
        setRanks(savedRanks);
        localStorage.setItem('projectRanks', JSON.stringify(savedRanks));
      }
    };

    const fetchGroupId = async () => {
      if (!userContext?.id) return;

      const { data, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userContext.id)
        .single();

      if (error) {
        console.error('Error fetching group ID:', error);
        return;
      }

      if (data) {
        setGroupId(data.group_id);
        await fetchSavedRanks(data.group_id);
      }
    };

    if (loggedIn && userContext?.id) {
      void fetchGroupId();
    }
  }, [loggedIn, userContext, studentProjects]);

  const handleRankSelect = (project: Project, rank: number) => {
    setRanks((prevRanks) => {
      const updatedRanks = { ...prevRanks };
      const projectNumber = project.project_number.toString();

      const existingProjectNumber = Object.keys(updatedRanks).find((key) => updatedRanks[key] === rank);

      if (existingProjectNumber && existingProjectNumber !== projectNumber) {
        delete updatedRanks[existingProjectNumber];
      }

      updatedRanks[projectNumber] = rank;
      localStorage.setItem('projectRanks', JSON.stringify(updatedRanks));
      return updatedRanks;
    });
  };

  const handleSubmit = async () => {
    if (!groupId) {
      setAlertState({
        active: true,
        severity: 'error',
        errorMsg: 'You must be in a group to submit preferences. Please join or create a group first.',
      });
      return;
    }
    try {
      const { data: existingPreferences, error: fetchError } = await supabase
        .from('group_preferences')
        .select('*')
        .eq('group_id', groupId);

      if (fetchError) {
        console.error('Error fetching existing preferences:', fetchError);
        return;
      }

      const currentProjectIds = new Set(
        Object.keys(ranks)
          .map((projectNumber) => {
            const project = studentProjects.find((p) => p.project_number.toString() === projectNumber);
            return project ? project.project_id.toString() : null;
          })
          .filter((id): id is string => id !== null)
      );

      const toDelete = existingPreferences?.filter((pref) => !currentProjectIds.has(pref.project_id.toString())) || [];

      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('group_preferences')
          .delete()
          .eq('group_id', groupId)
          .in(
            'project_id',
            toDelete.map((pref) => pref.project_id)
          );

        if (deleteError) {
          console.error('Error deleting outdated preferences:', deleteError);
          return;
        }
      }

      const updates = Object.entries(ranks)
        .map(([projectNumber, rank]) => {
          const project = studentProjects.find((p) => p.project_number.toString() === projectNumber);
          if (!project) {
            console.error(`Project not found for number: ${projectNumber}`);
            return null;
          }
          return {
            group_id: groupId,
            project_id: project.project_id,
            preference_rank: rank,
          };
        })
        .filter((update): update is NonNullable<typeof update> => update !== null);

      if (updates.length > 0) {
        const { error: upsertError } = await supabase
          .from('group_preferences')
          .upsert(updates, { onConflict: 'group_id,project_id' });

        if (upsertError) {
          console.error('Error upserting preferences:', upsertError);
          return;
        }
      }

      // fetch group members and notify
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (membersError) {
        console.error('Error fetching group members:', membersError);
        return;
      }

      for (const member of members) {
        try {
          await supabase.from('notifications').insert({
            user_id: member.user_id,
            body: 'Project preferences have been updated.',
            created_at: new Date().toISOString(),
            read: false,
          });
        } catch (error) {
          console.error('Error sending notification to members:', error);
        }
      }

      setAlertState({
        active: true,
        severity: 'success',
        errorMsg: 'Preferences submitted successfully!',
      });
    } catch (error) {
      console.error('Error:', error);
      setAlertState({
        active: true,
        severity: 'error',
        errorMsg: `Error submitting preferences: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  const handleOpenModal = (projectId: string) => {
    setCurrentProjectId(projectId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setCurrentProjectId(null), 300);
  };

  const renderProjectCard = (project: Project, idx: number) => {
    return (
      <div
        key={idx}
        className={`${styles.projectCard} ${styles.clickable}`}
        onClick={() => handleOpenModal(project.project_id)}>
        <div className={styles.projectTags}>
          {project.tags.tags.map((tagObj, idx) => {
            if (tagObj.weight > 0 && TAGS.includes(tagObj.tag as Tags)) {
              return <ProjectTag key={idx} tag={tagObj.tag as Tags} />;
            }
            return null;
          })}
        </div>
        <h1>
          Project {project.project_number} (P{project.project_number})
        </h1>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className={styles.dropdownContainer} onClick={(e) => e.stopPropagation()}>
          <Dropdown
            selectedRank={ranks[project.project_number.toString()] ?? null}
            onSelect={(rank) => handleRankSelect(project, rank)}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return <Loading />;
  }
  return (
    <div>
      <h1 className={styles.header}>Projects</h1>
      <ProjectSearch projects={studentProjects} userData={{}} onFilteredProjectsChange={setFilteredProjects} />
      <div className={styles.projectList}>
        {filteredProjects.map((project, idx) => (
          <div key={project.project_number} className={styles.projectContainer}>
            {renderProjectCard(project, idx)}
          </div>
        ))}
      </div>
      <div className={styles.projectSection}>
        <Button
          label='Submit Preferences'
          labelColour='var(--base-white)'
          backgroundColour='var(--primary-green)'
          handleClick={() => {
            void handleSubmit();
          }}
        />
      </div>
      {currentProjectId && (
        <ProjectModal open={isModalOpen} handleClose={handleCloseModal} projectId={currentProjectId} />
      )}
      <AlertSlider active={alertState.active} severity={alertState.severity} errorMsg={alertState.errorMsg} />
    </div>
  );
};

export default ProjectStudents;
