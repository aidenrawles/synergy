import { createTheme } from '@mui/material/styles';

// Custom theme for all MUI components
// Only caters for TextField, InputLabel, and FormControl components - feel free to add more!
export const theme = createTheme({
  components: {
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'var(--dark-purple)',
          '&.Mui-focused': {
            color: 'var(--secondary-purple)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'var(--secondary-purple)',
            },
            '&:hover fieldset': {
              borderColor: 'var(--secondary-purple)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'var(--secondary-purple)',
            },
          },
          '& .MuiSvgIcon-root': {
            color: 'var(--secondary-purple)',
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'var(--secondary-purple)',
            },
            '&:hover fieldset': {
              borderColor: 'var(--secondary-purple)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'var(--secondary-purple)',
            },
          },
        },
      },
    },
    MuiStepButton: {
      styleOverrides: {
        root: {
          color: 'var(--primary-purple)',
          '& .MuiStepIcon-root': {
            fill: 'var(--primary-purple)',
          },
        },
      },
    },
  },
});
