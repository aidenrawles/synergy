import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context';
import Loading from '../pages/Loading/Loading';

interface PrivateRouteProps {
  element: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element }) => {
  const { loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  const sessionStored = localStorage.getItem('session') === 'true' ? true : false;

  return !sessionStored && !loading ? <Navigate to='/login' /> : element;
};

export default PrivateRoute;
