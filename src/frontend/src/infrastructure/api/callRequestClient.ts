export interface CallRequestPayload {
  shopPhone: string;
  customerSlots: string[];
  submittedAt: string;
}

export interface CallRequestResponse {
  conversationId: string;
  callSid: string;
  message: string;
}

export async function postCallRequest(payload: CallRequestPayload): Promise<CallRequestResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
  const response = await fetch(`${baseUrl}/api/v1/call-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? 'Failed to initiate call.');
  }

  return response.json();
}
