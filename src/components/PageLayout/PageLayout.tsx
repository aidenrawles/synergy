import { type ReactNode } from 'react';
import Navbar from '../Navbar/Navbar';
import { useAuth } from '../../Context';

import styles from './PageLayout.module.scss';

interface PageLayoutProps {
  children: ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  const { loading } = useAuth();

  const sessionStored = localStorage.getItem('session') === 'true' ? true : false;

  return (
    <div className={styles.container}>
      {sessionStored && !loading ? <Navbar /> : null}
      <div>{children}</div>
    </div>
  );
};

export default PageLayout;
