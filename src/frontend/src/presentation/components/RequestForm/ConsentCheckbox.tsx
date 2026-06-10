import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: boolean;
  helperText?: string;
}

export function ConsentCheckbox({ checked, onChange, error, helperText }: ConsentCheckboxProps) {
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
            inputProps={{ 'aria-label': 'TCPA consent' }}
          />
        }
        label={
          <span>
            I authorize Intoxalock to contact me via automated call per the{' '}
            <Link href="#" target="_blank" rel="noopener noreferrer">
              Terms & Conditions
            </Link>
            .
          </span>
        }
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
