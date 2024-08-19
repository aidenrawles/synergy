// Projects page for Tutor & Coordinator
import React, { useState, useEffect } from 'react';
import styles from './ProjectList.module.scss';
import { Project, User, Tags } from '../../types/database-types';
import ProjectTag from '../../components/ProjectTag/ProjectTag';
import MemberAvatar from '../../components/MemberAvatar/MemberAvatar';
import ProjectModal from '../../components/ProjectModal/ProjectModal';
import ProjectSearch from '../../components/ProjectSearch/ProjectSearch';
import { getProjects } from '../../utils/helper/projectHelper';
import { getUserDataById } from '../../utils/helper/userHelper';

const ProjectList: React.FC = () => {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [userData, setUserData] = useState<Record<string, User>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      const projects = await getProjects();
      if (!('error' in projects)) {
        const sortedData = projects.sort((a, b) => a.project_number - b.project_number);
        setAllProjects(sortedData);
        setFilteredProjects(sortedData);

        const userDataPromises = sortedData.map((project) => getUserDataById(project.client_id));
        const userDataResults = await Promise.all(userDataPromises);

        const newUserData: Record<string, User> = {};
        userDataResults.forEach((result, index) => {
          newUserData[sortedData[index].client_id] = result;
        });
        setUserData(newUserData);
      } else {
        console.error('Error fetching projects:', projects.error);
      }
    };
    void fetchProjects();
  }, []);

  const handleOpenModal = (projectId: string) => {
    setCurrentProjectId(projectId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setCurrentProjectId(null), 300);
  };

  const renderProjectCard = (project: Project) => {
    const user = userData[project.client_id];
    return (
      <div className={`${styles.projectCard} ${styles.clickable}`} onClick={() => handleOpenModal(project.project_id)}>
        <div className={styles.projectTags}>
          {project.tags.tags.map((tag, idx) => {
            if (tag.weight > 0) return <ProjectTag key={idx} tag={tag.tag as Tags} />;
          })}
        </div>
        <h1>
          Project {project.project_number} (P{project.project_number})
        </h1>
        <h3>{project.title}</h3>
        <div className={styles.description}>
          <p>{project.description}</p>
        </div>
        {user && (
          <div className={styles.managedBy}>
            <MemberAvatar ids={[project.client_id]} />
            <span className={styles.managerName}>
              {user.first_name} {user.last_name} manages this
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h1 className={styles.header}>Projects</h1>
      {/*Add in a new search bar */}
      <ProjectSearch projects={allProjects} userData={userData} onFilteredProjectsChange={setFilteredProjects} />
      <div className={styles.projectList}>
        {filteredProjects.map((project) => (
          <div key={project.project_number} className={styles.projectContainer}>
            {renderProjectCard(project)}
          </div>
        ))}
      </div>
      {currentProjectId && (
        <ProjectModal open={isModalOpen} handleClose={handleCloseModal} projectId={currentProjectId} />
      )}
    </div>
  );
};

export default ProjectList;
