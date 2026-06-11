import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import type { RemovalRequestRecord } from '../../domain/entities/RemovalRequestRecord';
import { getRemovalRequests } from '../../application/useCases/getRemovalRequests';
import RequestsTable from '../components/RequestsTable/RequestsTable';

export default function RequestsDashboardPage() {
  const [records, setRecords] = useState<RemovalRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRemovalRequests()
      .then((data) => {
        setRecords(data);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load records.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" component="h1" color="secondary" gutterBottom>
        Removal Request Records
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

      {!loading && !error && <RequestsTable records={records} />}
    </Container>
  );
}
