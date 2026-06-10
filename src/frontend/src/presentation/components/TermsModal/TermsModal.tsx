import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

const sections = [
  {
    title: '1. Consent to Contact',
    body: 'By checking the consent box and submitting this form, you expressly authorize Intoxalock and its representatives to contact you at the phone number you provided using an automated dialing system, artificial or pre-recorded voice, or other automated means, for the purpose of assisting you with your ignition interlock device removal process.',
  },
  {
    title: '2. TCPA Disclosure',
    body: 'This consent is provided pursuant to the Telephone Consumer Protection Act (TCPA), 47 U.S.C. § 227. You understand that consent to be contacted is not a condition of purchasing any goods or services from Intoxalock. Message and data rates may apply.',
  },
  {
    title: '3. How We Use Your Information',
    body: 'Your name and phone number will be used solely to initiate an outbound call from an AI-assisted agent to guide you through the device removal process. We do not sell, rent, or share your personal information with third parties for marketing purposes.',
  },
  {
    title: '4. Opt-Out',
    body: 'You may revoke this consent at any time by contacting Intoxalock customer support at 1-877-777-7422. Revoking consent will not affect any prior communications made while consent was active.',
  },
  {
    title: '5. Privacy Policy',
    body: 'For more information about how Intoxalock collects, uses, and protects your personal data, please visit the full Privacy Policy at intoxalock.com/privacy-policy.',
  },
];

export function TermsModal({ open, onClose }: TermsModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ bgcolor: '#1A2B4A', color: 'white', fontWeight: 700 }}>
        Terms & Conditions — TCPA Consent
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sections.map((section, i) => (
            <Box key={i}>
              {i > 0 && <Divider sx={{ mb: 2 }} />}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {section.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {section.body}
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          I Understand
        </Button>
      </DialogActions>
    </Dialog>
  );
}
