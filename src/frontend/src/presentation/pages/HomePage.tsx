import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { submitRemovalRequest } from '../../application/useCases/submitRemovalRequest';
import type { RemovalRequest } from '../../domain/entities/RemovalRequest';
import { RequestForm } from '../components/RequestForm/RequestForm';
import { ConfirmationScreen } from '../components/ConfirmationScreen/ConfirmationScreen';

type PageState = 'IDLE' | 'SUBMITTING' | 'CONFIRMED' | 'ERROR';

interface ConfirmedData {
  conversationId: string;
  callSid: string;
  message: string;
}

export default function HomePage() {
  const [pageState, setPageState] = useState<PageState>('IDLE');
  const [confirmedData, setConfirmedData] = useState<ConfirmedData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastRequest, setLastRequest] = useState<RemovalRequest | null>(null);

  const handleSuccess = (data: ConfirmedData) => {
    setConfirmedData(data);
    setPageState('CONFIRMED');
  };

  const handleError = (error: Error, request: RemovalRequest) => {
    setErrorMessage(error.message);
    setLastRequest(request);
    setPageState('ERROR');
  };

  const handleRetry = async () => {
    if (!lastRequest) return;
    setPageState('SUBMITTING');
    try {
      const result = await submitRemovalRequest(lastRequest);
      handleSuccess(result);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Unexpected error'), lastRequest);
    }
  };

  const handleReset = () => {
    setPageState('IDLE');
    setConfirmedData(null);
    setErrorMessage('');
    setLastRequest(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            Intoxalock — Device Removal Request
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4 }}>
          {pageState === 'CONFIRMED' && confirmedData ? (
            <ConfirmationScreen
              conversationId={confirmedData.conversationId}
              onReset={handleReset}
            />
          ) : (
            <>
              <Typography variant="h5" gutterBottom>
                Request Device Removal Call
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your details and an AI agent will call you to assist with your device removal.
              </Typography>

              {pageState === 'ERROR' && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  action={
                    <Button color="inherit" size="small" onClick={handleRetry}>
                      Try Again
                    </Button>
                  }
                >
                  {errorMessage || 'Something went wrong. Please try again.'}
                </Alert>
              )}

              <RequestForm
                onSuccess={handleSuccess}
                onError={handleError}
                submitFn={submitRemovalRequest}
              />
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
