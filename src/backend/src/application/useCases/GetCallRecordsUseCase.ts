import type { ICallRecordRepository } from '../../domain/ports/ICallRecordRepository';
import type { CallRecord } from '../../domain/entities/CallRecord';

export class GetCallRecordsUseCase {
  constructor(private readonly repository: ICallRecordRepository) {}

  async execute(): Promise<CallRecord[]> {
    return this.repository.findAll();
  }
}
