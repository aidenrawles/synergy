import React, { useState } from 'react';
import supabase from '../../config/supabaseClient';
import styles from './Login.module.scss';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '@mui/material';
import logo from '../../assets/synergy-logo.svg';
import Button from '../../components/Button/Button';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      navigate('/');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.logoContainer}>
        <img src={logo} alt='Synergy Logo' className={styles.logo} />
        <h1>Synergy</h1>
      </div>
      <form onSubmit={(e) => void handleLogin(e)} className={styles.loginForm}>
        <h1>Log In</h1>
        {error && <Alert severity='error'>{error}</Alert>}
        <div className={styles.inputGroup}>
          <label htmlFor='email'>Email:</label>
          <input type='email' id='email' value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor='password'>Password:</label>
          <input
            type='password'
            id='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button label='Log in' backgroundColour='var(--primary-purple)' labelColour='var(--base-white)' />
        <p className={styles.signUpLink}>
          New to Synergy? <Link to='/register/student'>Sign up here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
