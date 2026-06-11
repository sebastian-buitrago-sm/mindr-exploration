import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import intoxalockTheme from './presentation/theme/intoxalockTheme';
import HomePage from './presentation/pages/HomePage';
import RequestsDashboardPage from './presentation/pages/RequestsDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={intoxalockTheme}>
        <CssBaseline />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/requests" element={<RequestsDashboardPage />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
