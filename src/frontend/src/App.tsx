import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import intoxalockTheme from './presentation/theme/intoxalockTheme';
import HomePage from './presentation/pages/HomePage';

function App() {
  return (
    <ThemeProvider theme={intoxalockTheme}>
      <CssBaseline />
      <HomePage />
    </ThemeProvider>
  );
}

export default App;
