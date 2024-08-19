import { useAuth } from '../../Context';
import ClientGroups from '../../components/ClientGroups/ClientGroups';
import StudentGroups from '../../components/StudentGroups/StudentGroups';

import styles from './Groups.module.scss';
import { UserType } from '../../types/enums';

const Groups = () => {
  const { userContext } = useAuth();

  return (
    <div className={styles.groupsWrapper}>
      {userContext?.userType === UserType.Client && <ClientGroups />}
      {userContext?.userType === UserType.Student && <StudentGroups />}
    </div>
  );
};

export default Groups;
