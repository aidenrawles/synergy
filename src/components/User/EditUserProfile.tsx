import React, { useEffect, useState } from 'react';
import supabase from '../../config/supabaseClient';
import styles from './EditUserProfile.module.scss';
import { useNavigate } from 'react-router-dom';
import { UserType } from '../../types/enums';
import { RegisterUser } from '../../utils/auth';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useAuth } from '../../Context';
import Button from '../Button/Button';
import { getTutorialCodes } from '../../utils/helper/utilityHelper';
import { Course, TutorialCodes } from '../../utils/helperInterface';

const EditUserProfile = () => {
  const navigate = useNavigate();
  const { userContext } = useAuth();
  const [userInfo, setUserInfo] = useState<RegisterUser>({
    nameFirst: userContext.firstName ? userContext.firstName : '',
    nameLast: userContext.lastName ? userContext.lastName : '',
    email: userContext.email ? userContext.email : '',
    password: '',
    confirmPassword: '',
    role: userContext.userType ? userContext.userType : UserType.Student,
    zid: userContext.zid ? userContext.zid : '',
    tutorial: userContext.tutorial ? userContext.tutorial : '',
    class: userContext.course ? userContext.course : '',
  });
  const [tutorials, setTutorials] = useState<TutorialCodes>({ COMP3900: [], COMP9900: [] });

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const tutorialCodes = await getTutorialCodes();
        setTutorials(tutorialCodes);
      } catch (error) {
        console.error('Error fetching tutorials:', error);
      }
    };

    if (userContext.userType === UserType.Student) {
      void fetchTutorials();
    }
  }, []);

  const updateUserDetails = async (id: string) => {
    await supabase
      .from('users')
      .update({
        first_name: userInfo.nameFirst,
        last_name: userInfo.nameLast,
        zid: userInfo.zid,
        tutorial: userInfo.tutorial,
        role: userInfo.role.toLowerCase(),
      })
      .eq('auth_id', id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserDetails(userContext.id ? userContext.id : '');
    navigate('/profile');
    window.location.reload();
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.logoContainer}></div>
      <form onSubmit={(e) => void handleSave(e)} className={styles.registerForm}>
        <div className={styles.registerHeader}>
          <h1>Edit User</h1>
          <div className={styles.role}>{userInfo.role}</div>
        </div>
        <div className={styles.split}>
          <div className={styles.inputGroup}>
            <label htmlFor='nameFirst'>First Name:</label>
            <input
              type='text'
              id='nameFirst'
              value={userInfo.nameFirst}
              onChange={(e) => setUserInfo({ ...userInfo, nameFirst: e.target.value })}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor='nameLast'>Last Name:</label>
            <input
              type='text'
              id='nameLast'
              value={userInfo.nameLast}
              onChange={(e) => setUserInfo({ ...userInfo, nameLast: e.target.value })}
              required
            />
          </div>
        </div>
        {userInfo.role !== UserType.Client && (
          <>
            <div className={styles.inputGroup}>
              <label htmlFor='zid'>zID:</label>
              <input
                type='text'
                id='zid'
                value={userInfo.zid}
                readOnly={true}
                onChange={(e) => setUserInfo({ ...userInfo, zid: e.target.value })}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor='email'>UNSW Email:</label>
              <input
                type='email'
                id='email'
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                readOnly={true}
                required
              />
            </div>
          </>
        )}
        {userInfo.role === UserType.Client && (
          <>
            <div className={styles.inputGroup}>
              <label htmlFor='email'>Email:</label>
              <input
                type='email'
                id='email'
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                readOnly
              />
            </div>
          </>
        )}
        <div className={styles.courseInfo}>
          {userInfo.role === UserType.Student && (
            <div className={styles.split}>
              <FormControl fullWidth>
                <InputLabel
                  id='tutorial-code-label'
                  sx={{
                    color: 'var(--dark-purple)',
                    '&.Mui-focused': {
                      color: 'var(--dark-purple)',
                    },
                  }}>
                  Tutorial Code
                </InputLabel>
                <Select
                  labelId='tutorial-code-label'
                  value={userInfo.tutorial}
                  onChange={(e) => setUserInfo({ ...userInfo, tutorial: e.target.value })}
                  label='Tutorial Code'
                  required
                  sx={{
                    color: 'var(--dark-purple)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--secondary-purple)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--secondary-purple)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--secondary-purple)',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'var(--secondary-purple)',
                    },
                  }}>
                  {userInfo.class &&
                    tutorials[userInfo.class as Course].map((tute: string, idx: number) => (
                      <MenuItem
                        key={idx}
                        value={tute}
                        sx={{
                          color: 'var(--dark-purple)',
                          '&.Mui-selected': {
                            backgroundColor: 'var(--light-purple)',
                          },
                          '&.Mui-selected:hover': {
                            backgroundColor: 'var(--secondary-purple)',
                          },
                          '&:hover': {
                            backgroundColor: 'var(--secondary-purple)',
                          },
                        }}>
                        {tute}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </div>
          )}{' '}
        </div>
        <Button label='Save' backgroundColour='var(--primary-purple)' labelColour='var(--base-white)' />
      </form>
    </div>
  );
};

export default EditUserProfile;
