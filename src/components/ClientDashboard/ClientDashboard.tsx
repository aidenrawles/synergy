import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context';

import ProjectTag from '../../components/ProjectTag/ProjectTag';
import Button from '../../components/Button/Button';

import styles from './ClientDashboard.module.scss';
import { Project, Tags } from '../../types/database-types';
import { getProjectsWithClientId } from '../../utils/helper/projectHelper';

const ClientDashboard = () => {
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const { userContext } = useAuth();
  const navigate = useNavigate();
  const currDate = new Date();

  const formattedCurrDate = currDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    const fetchProjects = async () => {
      const projects = await getProjectsWithClientId(userContext.id);
      if (!('error' in projects)) {
        setProjectsList(projects ? projects : []);
      }
    };
    if (userContext?.id) void fetchProjects();
  }, []);

  const renderProjectCard = (project: Project, idx: number) => {
    return (
      <div key={idx} className={styles.projectCard} onClick={() => navigate(`/project/${project.project_id}`)}>
        <div key={idx} className={styles.projectTags}>
          {project.tags.tags.map((tag, idx) => {
            if (tag.weight > 0) return <ProjectTag key={idx} tag={tag.tag as Tags} />;
          })}
        </div>
        <h1>
          Project {project?.project_number} (P{project?.project_number})
        </h1>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
      </div>
    );
  };

  return (
    <>
      <h2 className={styles.date}>{formattedCurrDate}</h2>
      <h1 className={styles.header}>Welcome back, {userContext?.firstName}</h1>
      <div className={styles.projectSection}>
        <h1 className={styles.projectsHeader}>Projects managed:</h1>
        <Button
          label='Create new project'
          labelColour='var(--primary-purple)'
          backgroundColour='var(--light-purple)'
          handleClick={() => navigate('/project/new')}
        />
      </div>
      <div className={styles.projectList}>{projectsList.map(renderProjectCard)}</div>
    </>
  );
};

export default ClientDashboard;
