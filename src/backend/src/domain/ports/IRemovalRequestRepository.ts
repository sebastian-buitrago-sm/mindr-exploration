import { RemovalRequestRecord } from '../entities/RemovalRequestRecord';

export interface IRemovalRequestRepository {
  save(record: RemovalRequestRecord): Promise<void>;
  findAll(): Promise<RemovalRequestRecord[]>;
}
