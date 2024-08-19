import ProjectList from '../../components/ProjectList/ProjectList';
import ProjectStudents from '../../components/ProjectStudents/ProjectStudents';
import { useAuth } from '../../Context';
import { UserType } from '../../types/enums';
import styles from './Projects.module.scss';
const Projects = () => {
  const { userContext } = useAuth();

  return (
    <div className={styles.projectsWrapper}>
      {userContext?.userType === UserType.Student && <ProjectStudents />}
      {userContext?.userType === UserType.Tutor && <ProjectList />}
      {userContext?.userType === UserType.Coordinator && <ProjectList />}
      {/* Other Projects table go here */}
    </div>
  );
};

export default Projects;
