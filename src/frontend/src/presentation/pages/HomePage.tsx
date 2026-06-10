import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 1.5 }}>
          {/* Logo mark — orange square accent mimicking Intoxalock's brand */}
          <Box
            sx={{
              width: 10,
              height: 32,
              bgcolor: '#F47920',
              borderRadius: 0.5,
              mr: 0.5,
            }}
          />
          <Typography
            variant="h6"
            component="h1"
            sx={{ fontWeight: 900, letterSpacing: '0.02em', color: 'white', fontSize: '1.1rem' }}
          >
            intoxalock
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>
            Ignition Interlock
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Orange accent bar */}
      <Box sx={{ height: 4, bgcolor: '#F47920' }} />

      {/* Hero band */}
      <Box sx={{ bgcolor: '#1A2B4A', py: 3, px: 2, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
          Device Removal Request
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
          An AI agent will call you to guide you through the removal process.
        </Typography>
      </Box>

      {/* Main content */}
      <Container maxWidth="sm" sx={{ py: 4, flex: 1 }}>
        <Paper
          elevation={3}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Card header accent */}
          <Box sx={{ bgcolor: '#F47920', height: 6 }} />

          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {pageState === 'CONFIRMED' && confirmedData ? (
              <ConfirmationScreen
                conversationId={confirmedData.conversationId}
                onReset={handleReset}
              />
            ) : (
              <>
                <Typography variant="h5" gutterBottom sx={{ color: '#1A2B4A' }}>
                  Request a Removal Call
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enter your name and phone number below. Our AI agent will call you shortly to
                  complete your device removal.
                </Typography>

                <Divider sx={{ mb: 3 }} />

                {pageState === 'ERROR' && (
                  <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    action={
                      <Button color="inherit" size="small" onClick={handleRetry} sx={{ fontWeight: 700 }}>
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
          </Box>
        </Paper>

        {/* Footer note */}
        <Typography variant="caption" component="p" sx={{ mt: 2, color: 'text.disabled', textAlign: 'center' }}>
          © {new Date().getFullYear()} Intoxalock. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
