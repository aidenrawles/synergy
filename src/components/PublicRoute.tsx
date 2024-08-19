import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context';
import Loading from '../pages/Loading/Loading';

interface PublicRouteProps {
  element: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ element }) => {
  const { loading } = useAuth();
  if (loading) {
    return <Loading />;
  }
  const sessionStored = localStorage.getItem('session') === 'true' ? true : false;

  return sessionStored ? <Navigate to='/' /> : element;
};

export default PublicRoute;
