import { z } from 'zod';

export const removalRequestSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name must be 100 characters or less'),
  countryCode: z.string(),
  dialCode: z.string(),
  localPhoneNumber: z.string(),
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, 'Please enter a valid phone number'),
  tcpaConsent: z.literal(true, { error: 'You must consent to be contacted' }),
  submittedAt: z.string(),
});

export type RemovalRequest = z.infer<typeof removalRequestSchema>;
