import type { RemovalRequestRecord } from '../../domain/entities/RemovalRequestRecord';
import { fetchRemovalRequests } from '../../infrastructure/api/removalRequestsClient';

export async function getRemovalRequests(): Promise<RemovalRequestRecord[]> {
  return fetchRemovalRequests();
}
