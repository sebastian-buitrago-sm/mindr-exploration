import type { CallRecord } from '../entities/CallRecord';

export interface ICallRecordRepository {
  save(record: CallRecord): Promise<void>;
  updateStatus(
    callId: string,
    status: CallRecord['status'],
    confirmedSlot?: string,
    shopSuggestedSlots?: string
  ): Promise<void>;
  findLatestInProgressByShopPhone(shopPhone: string): Promise<CallRecord | null>;
  findAll(): Promise<CallRecord[]>;
}
