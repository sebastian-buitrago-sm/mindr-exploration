import { createTheme } from '@mui/material/styles';

const intoxalockTheme = createTheme({
  palette: {
    primary: {
      main: '#F47920',
      dark: '#D4610A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1A2B4A',
      dark: '#0F1C32',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F7F7F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#555555',
    },
  },
  typography: {
    fontFamily: '"Source Sans Pro", "Helvetica Neue", Arial, sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: '#1A2B4A' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { fontWeight: 700, letterSpacing: '0.06em', boxShadow: 'none' },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: { color: '#F47920', '&.Mui-checked': { color: '#F47920' } },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: { color: '#F47920', '&:hover': { color: '#D4610A' } },
      },
    },
  },
});

export default intoxalockTheme;
