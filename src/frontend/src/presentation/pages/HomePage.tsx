import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { PendingCallForm } from '../components/PendingCallForm/PendingCallForm';

export default function HomePage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 1.5 }}>
          <Box sx={{ width: 10, height: 32, bgcolor: '#F47920', borderRadius: 0.5, mr: 0.5 }} />
          <Typography
            variant="h6"
            component="h1"
            sx={{ fontWeight: 900, letterSpacing: '0.02em', color: 'white', fontSize: '1.1rem' }}
          >
            intoxalock
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            component={RouterLink}
            to="/requests"
            size="small"
            sx={{ color: 'white', textTransform: 'none', fontSize: '0.85rem' }}
          >
            Call Records
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ height: 4, bgcolor: '#F47920' }} />

      <Box sx={{ bgcolor: '#1A2B4A', py: 3, px: 2, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
          Device Removal Scheduling
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
          Enter the shop's phone and the customer's available time slots. Daisy will call the shop to confirm.
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ py: 4, flex: 1 }}>
        <Paper
          elevation={3}
          sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
        >
          <Box sx={{ bgcolor: '#F47920', height: 6 }} />
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <PendingCallForm />
          </Box>
        </Paper>

        <Typography variant="caption" component="p" sx={{ mt: 2, color: 'text.disabled', textAlign: 'center' }}>
          © {new Date().getFullYear()} Intoxalock. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
