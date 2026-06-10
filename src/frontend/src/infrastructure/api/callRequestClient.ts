import type { CallRecord } from '../../domain/entities/CallRecord';

export interface CallRequestPayload {
  fullName: string;
  phoneNumber: string;
  tcpaConsent: true;
  submittedAt: string;
}

export async function postCallRequest(payload: CallRequestPayload): Promise<CallRecord> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
  const response = await fetch(`${baseUrl}/api/v1/call-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to initiate call. Please try again.');
  }

  return response.json();
}
