import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import SvgIcon from '@mui/material/SvgIcon';

interface ConfirmationScreenProps {
  conversationId: string;
  onReset: () => void;
}

export function ConfirmationScreen({ conversationId, onReset }: ConfirmationScreenProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <SvgIcon color="success" sx={{ fontSize: 64, mb: 2 }} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </SvgIcon>
      <Typography variant="h5" gutterBottom>
        Request Received
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Your request has been received. An AI Agent will contact you shortly.
      </Typography>
      <Typography variant="caption" display="block" sx={{ mt: 1, mb: 3, color: 'text.disabled' }}>
        Reference ID: {conversationId}
      </Typography>
      <Button variant="outlined" color="primary" onClick={onReset}>
        Submit Another Request
      </Button>
    </Box>
  );
}
