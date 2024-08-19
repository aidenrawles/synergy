import React, { useEffect, useState } from 'react';
import supabase from '../../config/supabaseClient';
import styles from './Register.module.scss';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { UserType } from '../../types/enums';
import { RegisterUser, registerCheck, updateInvite, validateToken } from '../../utils/auth';
import { Alert, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { RegisterToken, decrypt } from '../../utils/crypto';
import logo from '../../assets/synergy-logo.svg';
import Button from '../../components/Button/Button';
import { Course, TutorialCodes } from '../../utils/helperInterface';
import { getTutorialCodes } from '../../utils/helper/utilityHelper';

const courses: Course[] = ['COMP3900', 'COMP9900'];

const Register: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [registerToken] = useState<RegisterToken>(decrypt(token));
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | ''>('');
  const [tutorials, setTutorials] = useState<TutorialCodes>({ COMP3900: [], COMP9900: [] });
  const [userInfo, setUserInfo] = useState<RegisterUser>({
    nameFirst: '',
    nameLast: '',
    email: registerToken.email,
    password: '',
    confirmPassword: '',
    role: registerToken.role,
    zid: '',
    tutorial: '',
    class: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = await registerCheck(userInfo);
    if (msg) {
      setError(msg);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: userInfo.email,
      password: userInfo.password,
      options: {
        data: {
          first_name: userInfo.nameFirst,
          last_name: userInfo.nameLast,
          zid: userInfo.zid,
          tutorial: userInfo.tutorial,
          class: course,
          role: userInfo.role.toLowerCase(),
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      await updateInvite(userInfo.email);
      navigate('/');
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      const { data, error } = await supabase.from('users').select();
      if (error) {
        console.error('Failed to fetch:', error);
        throw new Error('Failed to fetch user data');
      }

      if (data?.length === 0) {
        registerToken.role = UserType.Admin;
        setUserInfo({ ...userInfo, role: UserType.Admin });
      } else if (!(await validateToken(registerToken)) && token !== 'student') {
        navigate('/register/student');
      }
    };
    void checkToken();
  }, [token, registerToken, navigate]);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const tutorialCodes = await getTutorialCodes();
        setTutorials(tutorialCodes);
      } catch (error) {
        console.error('Error fetching tutorials:', error);
      }
    };
    if (userInfo.role === UserType.Student) {
      void fetchTutorials();
    }
  }, []);

  return (
    <div className={styles.registerContainer}>
      <div className={styles.logoContainer}>
        <img src={logo} alt='Synergy Logo' className={styles.logo} />
        <h1>Synergy</h1>
      </div>
      <form onSubmit={(e) => void handleRegister(e)} className={styles.registerForm}>
        <div className={styles.registerHeader}>
          <h1>Register</h1>
          <div className={styles.role}>{registerToken.role}</div>
        </div>
        {error && <Alert severity='error'>{error}</Alert>}
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
                readOnly={registerToken.email.length > 0}
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
        <div className={styles.inputGroup}>
          <label htmlFor='password'>Password:</label>
          <input
            type='password'
            id='password'
            value={userInfo.password}
            onChange={(e) => setUserInfo({ ...userInfo, password: e.target.value })}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor='confirmPassword'>Confirm Password:</label>
          <input
            type='password'
            id='confirmPassword'
            value={userInfo.confirmPassword}
            onChange={(e) => setUserInfo({ ...userInfo, confirmPassword: e.target.value })}
            required
          />
        </div>
        <div className={styles.courseInfo}>
          {userInfo.role === UserType.Student && (
            <div className={styles.split}>
              <FormControl fullWidth>
                <InputLabel
                  id='course-code-label'
                  sx={{
                    color: 'var(--dark-purple)',
                    '&.Mui-focused': {
                      color: 'var(--dark-purple)',
                    },
                  }}>
                  Course Code
                </InputLabel>
                <Select
                  labelId='course-code-label'
                  value={course}
                  onChange={(e) => setCourse(e.target.value as Course)}
                  label='Course Code'
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
                  {courses.map((course, idx) => (
                    <MenuItem
                      key={idx}
                      value={course}
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
                      {course}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                  {course && tutorials[course] ? (
                    tutorials[course].map((tute: string, idx: number) => (
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
                    ))
                  ) : (
                    <MenuItem disabled>Select Course Code</MenuItem>
                  )}
                </Select>
              </FormControl>
            </div>
          )}{' '}
        </div>
        <Button label='Register' backgroundColour='var(--primary-purple)' labelColour='var(--base-white)' />
        <p className={styles.loginLink}>
          Already have an account? <Link to='/login'>Log in here</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
