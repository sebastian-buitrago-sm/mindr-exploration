import type { RemovalRequest } from '../entities/RemovalRequest';
import type { CallRecord } from '../entities/CallRecord';

export interface ICallService {
  initiateCall(request: RemovalRequest): Promise<CallRecord>;
}
