import { useAuth } from '../../Context';
import ProjectEdit from '../../components/ProjectEdit/ProjectEdit';
import { UserType } from '../../types/enums';
import styles from './Project.module.scss';
const Projects = () => {
  const { userContext } = useAuth();

  return <div className={styles.projectWrapper}>{userContext?.userType === UserType.Client && <ProjectEdit />}</div>;
};

export default Projects;
