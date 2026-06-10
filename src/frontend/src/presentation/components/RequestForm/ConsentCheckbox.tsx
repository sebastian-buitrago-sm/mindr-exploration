import { useState } from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import { TermsModal } from '../TermsModal/TermsModal';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: boolean;
  helperText?: string;
}

export function ConsentCheckbox({ checked, onChange, error, helperText }: ConsentCheckboxProps) {
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <FormControl error={error}>
      <FormControlLabel
        htmlFor="tcpa-consent-checkbox"
        control={
          <Checkbox
            id="tcpa-consent-checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            color="primary"
          />
        }
        label={
          <span style={{ fontSize: '0.875rem' }}>
            I authorize Intoxalock to contact me via automated call per the{' '}
            <Link
              component="button"
              type="button"
              onClick={(e) => { e.preventDefault(); setTermsOpen(true); }}
              sx={{ fontWeight: 600, verticalAlign: 'baseline' }}
            >
              Terms & Conditions
            </Link>
            .
          </span>
        }
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </FormControl>
  );
}
