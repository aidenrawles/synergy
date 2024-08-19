import { useAuth } from '../../Context';
import StudentDashboard from '../../components/StudentDashboard/StudentDashboard';
import ClientDashboard from '../../components/ClientDashboard/ClientDashboard';
import AdminDashboard from '../../components/AdminDashboard/AdminDashboard';
import CoordinatorDashboard from '../../components/CoordinatorDashboard/CoordinatorDashboard';
import TutorDashboard from '../../components/TutorDashboard/TutorDashboard';

import styles from './Dashboard.module.scss';
import { UserType } from '../../types/enums';

const Dashboard = () => {
  const { userContext } = useAuth();

  return (
    <div className={styles.dashboardWrapper}>
      {userContext?.userType === UserType.Student && <StudentDashboard />}
      {userContext?.userType === UserType.Client && <ClientDashboard />}
      {userContext?.userType === UserType.Admin && <AdminDashboard />}
      {userContext?.userType === UserType.Tutor && <TutorDashboard />}
      {userContext?.userType === UserType.Coordinator && <CoordinatorDashboard />}
    </div>
  );
};

export default Dashboard;
