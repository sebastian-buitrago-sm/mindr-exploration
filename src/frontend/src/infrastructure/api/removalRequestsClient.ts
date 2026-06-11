import type { RemovalRequestRecord } from '../../domain/entities/RemovalRequestRecord';

interface RemovalRequestsResponse {
  records: RemovalRequestRecord[];
}

export async function fetchRemovalRequests(): Promise<RemovalRequestRecord[]> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
  const response = await fetch(`${baseUrl}/api/v1/removal-requests`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to fetch records.');
  }

  const data: RemovalRequestsResponse = await response.json();
  return data.records;
}
