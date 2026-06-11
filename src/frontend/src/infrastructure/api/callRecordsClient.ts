import type { CallRecord } from '../../domain/entities/CallRecord';

interface CallRecordsResponse {
  records: CallRecord[];
}

export async function fetchCallRecords(): Promise<CallRecord[]> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
  const response = await fetch(`${baseUrl}/api/v1/removal-requests`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? 'Failed to fetch records.');
  }

  const data: CallRecordsResponse = await response.json();
  return data.records;
}
