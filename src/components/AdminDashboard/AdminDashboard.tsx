import { useAuth } from '../../Context';
import InviteStatus from '../InviteStatus/InviteStatus';

import styles from './AdminDashboard.module.scss';

const AdminDashboard = () => {
  const { userContext } = useAuth();
  const currDate = new Date();

  const formattedCurrDate = currDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div>
      <h2 className={styles.date}>{formattedCurrDate}</h2>
      <h1 className={styles.header}>Welcome back, {userContext?.firstName}</h1>
      <InviteStatus />
    </div>
  );
};

export default AdminDashboard;
