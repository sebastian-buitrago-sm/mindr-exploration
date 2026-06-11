import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import { Link as RouterLink } from 'react-router-dom';
import type { CallRecord } from '../../domain/entities/CallRecord';
import { getCallRecords } from '../../application/useCases/getCallRecords';
import CallRecordsTable from '../components/CallRecordsTable/CallRecordsTable';

export default function RequestsDashboardPage() {
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCallRecords()
      .then(setRecords)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load records.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 1.5 }}>
          <Box sx={{ width: 10, height: 32, bgcolor: '#F47920', borderRadius: 0.5, mr: 0.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', fontSize: '1.1rem' }}>
            intoxalock
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            component={RouterLink}
            to="/"
            size="small"
            sx={{ color: 'white', textTransform: 'none', fontSize: '0.85rem' }}
          >
            ← Initiate Call
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ height: 4, bgcolor: '#F47920' }} />

      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Typography variant="h4" component="h1" sx={{ color: '#003366', fontWeight: 700, mb: 3 }}>
          Call Records
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress color="primary" />
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && <CallRecordsTable records={records} />}
      </Container>
    </Box>
  );
}
