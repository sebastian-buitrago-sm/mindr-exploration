import { createTheme } from '@mui/material/styles';

const intoxalockTheme = createTheme({
  palette: {
    primary: {
      main: '#003366',
      dark: '#002244',
    },
    secondary: {
      main: '#0066CC',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  shape: {
    borderRadius: 4,
  },
});

export default intoxalockTheme;
