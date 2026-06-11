import { fetchCallRecords } from '../../infrastructure/api/callRecordsClient';
import type { CallRecord } from '../../domain/entities/CallRecord';

export async function getCallRecords(): Promise<CallRecord[]> {
  return fetchCallRecords();
}
