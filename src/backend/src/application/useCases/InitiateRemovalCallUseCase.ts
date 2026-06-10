import type { ICallService } from '../../domain/ports/ICallService';
import type { RemovalRequest } from '../../domain/entities/RemovalRequest';
import type { CallRecord } from '../../domain/entities/CallRecord';

export class InitiateRemovalCallUseCase {
  constructor(private readonly callService: ICallService) {}

  async execute(request: RemovalRequest): Promise<CallRecord> {
    return this.callService.initiateCall(request);
  }
}
