import { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import AlertTitle from '@mui/material/AlertTitle';

import styles from './AlertSlider.module.scss';

interface AlertSlider {
  active: boolean;
  severity: 'success' | 'info' | 'warning' | 'error';
  errorMsg: string;
  setActive?: React.Dispatch<React.SetStateAction<boolean>>;
}

const AlertSlider = ({ active, severity, errorMsg, setActive }: AlertSlider) => {
  const [showAlert, setShowAlert] = useState(active);

  // If there are changes on users end
  useEffect(() => {
    setShowAlert(active);
  }, [active]);

  const handleClose = () => {
    setShowAlert(false);
    if (setActive) setActive(false);
  };

  useEffect(() => {
    setTimeout(() => {
      if (setActive) setActive(false);
    }, 1000);
  });

  return (
    <Snackbar
      open={showAlert}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Alert severity={severity} className={styles.alert} onClose={handleClose} variant='filled'>
        <AlertTitle className={styles.alertTitle}>{severity.toUpperCase()}</AlertTitle>
        {errorMsg}
      </Alert>
    </Snackbar>
  );
};

export default AlertSlider;
