import { MuiTelInput, type MuiTelInputInfo } from 'mui-tel-input';

interface PhoneInputProps {
  value: string;
  onChange: (e164Value: string) => void;
  error?: boolean;
  helperText?: string;
}

export function PhoneInput({ value, onChange, error, helperText }: PhoneInputProps) {
  const handleChange = (_displayValue: string, info: MuiTelInputInfo) => {
    // Use the E.164 numberValue (no spaces) so Zod regex validates correctly
    onChange(info.numberValue ?? _displayValue);
  };

  return (
    <MuiTelInput
      defaultCountry="US"
      value={value}
      onChange={handleChange}
      fullWidth
      label="Phone Number"
      error={error}
      helperText={helperText}
    />
  );
}
