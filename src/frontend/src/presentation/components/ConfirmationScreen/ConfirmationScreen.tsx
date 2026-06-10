import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import SvgIcon from '@mui/material/SvgIcon';
import Divider from '@mui/material/Divider';

interface ConfirmationScreenProps {
  conversationId: string;
  onReset: () => void;
}

export function ConfirmationScreen({ conversationId, onReset }: ConfirmationScreenProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: '#FFF3E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        <SvgIcon sx={{ fontSize: 40, color: '#F47920' }} viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </SvgIcon>
      </Box>

      <Typography variant="h5" gutterBottom sx={{ color: '#1A2B4A', fontWeight: 700 }}>
        Request Received!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Your request has been received.{' '}
        <strong>An AI Agent will contact you shortly.</strong>
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" component="p" sx={{ color: 'text.disabled', mb: 3 }}>
        Reference ID: <strong>{conversationId}</strong>
      </Typography>

      <Button variant="outlined" color="primary" onClick={onReset} sx={{ fontWeight: 700 }}>
        Submit Another Request
      </Button>
    </Box>
  );
}
