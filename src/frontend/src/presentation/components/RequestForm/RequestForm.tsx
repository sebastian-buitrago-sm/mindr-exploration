import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { removalRequestSchema, type RemovalRequest } from '../../../domain/entities/RemovalRequest';
import { PhoneInput } from './PhoneInput';
import { ConsentCheckbox } from './ConsentCheckbox';

interface RequestFormProps {
  onSuccess: (data: { conversationId: string; callSid: string; message: string }) => void;
  onError: (error: Error, request: RemovalRequest) => void;
  submitFn: (request: RemovalRequest) => Promise<{ conversationId: string; callSid: string; message: string }>;
}

export function RequestForm({ onSuccess, onError, submitFn }: RequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RemovalRequest>({
    resolver: zodResolver(removalRequestSchema),
    defaultValues: {
      fullName: '',
      countryCode: 'US',
      dialCode: '+1',
      localPhoneNumber: '',
      phoneNumber: '',
      submittedAt: '',
    },
  });

  const onSubmit = async (data: RemovalRequest) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const request = { ...data, submittedAt: new Date().toISOString() };
    try {
      const result = await submitFn(request);
      onSuccess(result);
    } catch (err) {
      onError(err instanceof Error ? err : new Error('Unexpected error'), request);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Controller
        name="fullName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Full Name"
            fullWidth
            required
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            inputProps={{ 'aria-label': 'Full Name' }}
          />
        )}
      />

      <Controller
        name="phoneNumber"
        control={control}
        render={({ field }) => (
          <PhoneInput
            value={field.value}
            onChange={field.onChange}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber?.message}
          />
        )}
      />

      <Controller
        name="tcpaConsent"
        control={control}
        render={({ field }) => (
          <ConsentCheckbox
            checked={field.value === true}
            onChange={(checked) => field.onChange(checked || undefined)}
            error={!!errors.tcpaConsent}
            helperText={errors.tcpaConsent?.message}
          />
        )}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isSubmitting}
        fullWidth
        size="large"
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {isSubmitting ? 'Submitting...' : 'Request Device Removal Call'}
      </Button>
    </Box>
  );
}
