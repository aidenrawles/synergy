import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import styles from './Loading.module.scss';

const Loading = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100vh',
      }}
      className={styles.loadingContainer}>
      <h1>Loading...</h1>
      <CircularProgress
        size='100px'
        sx={{
          color: 'var(--primary-purple)',
        }}
      />
    </Box>
  );
};

export default Loading;
