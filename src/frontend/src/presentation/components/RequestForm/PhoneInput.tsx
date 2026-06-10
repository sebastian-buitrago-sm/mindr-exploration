import { MuiTelInput } from 'mui-tel-input';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
}

export function PhoneInput({ value, onChange, error, helperText }: PhoneInputProps) {
  return (
    <MuiTelInput
      defaultCountry="US"
      value={value}
      onChange={onChange}
      fullWidth
      label="Phone Number"
      error={error}
      helperText={helperText}
      inputProps={{ 'aria-label': 'Phone Number' }}
    />
  );
}
