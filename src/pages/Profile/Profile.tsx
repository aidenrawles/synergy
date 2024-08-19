import { useAuth } from '../../Context';

import styles from './Profile.module.scss';
import { Navigate, useParams } from 'react-router-dom';
import StudentProfile from '../../components/StudentProfile/StudentProfile';

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { userContext } = useAuth();

  return userContext.id !== id ? (
    <div className={styles.profileWrapper}>
      <StudentProfile id={id!} />
    </div>
  ) : (
    <div className={styles.profileWrapper}>
      <Navigate to='/profile' />
    </div>
  );
};

export default Profile;
