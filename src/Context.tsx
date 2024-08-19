import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import supabase from './config/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { UserType } from './types/enums';
import { getUserInfo } from './utils/helper/userHelper';
import { convertRoleToUserType } from './utils/helper/utilityHelper';

export interface InitialUserContext {
  user: UserContext;
  session: Session | null;
  loading: boolean;
}
export interface UserContext {
  id: string;
  firstName: string;
  lastName: string;
  zid: string;
  email: string;
  img: string;
  tutorial: string;
  course: string;
  userType: UserType;
}
interface Context {
  userContext: UserContext;
  session: Session | null;
  loading: boolean;
  loggedIn: boolean;
}

export const initialUserContext: InitialUserContext = {
  user: {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    zid: '',
    userType: UserType.Student,
    course: '',
    tutorial: '',
    img: '',
  },
  session: null,
  loading: true,
};

export const Context = createContext<Context | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userContext, setUserContext] = useState<UserContext>(initialUserContext.user);
  const [loggedIn, setLoggedIn] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUserInfo = async () => {
    const userData = await getUserInfo();
    setUserContext(
      userData
        ? {
            id: userData.id,
            firstName: userData.metaData.first_name,
            lastName: userData.metaData.last_name,
            zid: userData.metaData.zid,
            email: userData.metaData.email,
            img: userData.metaData.img,
            tutorial: userData.metaData.tutorial,
            course: userData.metaData.class,
            userType: convertRoleToUserType(userData.metaData.role),
          }
        : initialUserContext.user
    );
  };

  useEffect(() => {
    // Check initial session state
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      localStorage.setItem('session', session ? 'true' : 'false');
    };

    void getSession();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      localStorage.setItem('session', session ? 'true' : 'false');
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setLoggedIn(session !== null);
    if (!loggedIn) {
      setLoading(true);
      if (!session) setUserContext(initialUserContext.user);
    }
    setTimeout(() => {
      void fetchUserInfo();
    }, 500);
  }, [session]);

  useEffect(() => {
    setLoading(false);
  }, [userContext]);

  return <Context.Provider value={{ userContext, session, loading, loggedIn }}>{children}</Context.Provider>;
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
