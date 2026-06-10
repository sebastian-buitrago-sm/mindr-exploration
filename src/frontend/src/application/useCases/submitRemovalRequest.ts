import { postCallRequest } from '../../infrastructure/api/callRequestClient';
import type { RemovalRequest } from '../../domain/entities/RemovalRequest';
import type { CallRecord } from '../../domain/entities/CallRecord';

export async function submitRemovalRequest(request: RemovalRequest): Promise<CallRecord> {
  return postCallRequest({
    fullName: request.fullName,
    phoneNumber: request.phoneNumber,
    tcpaConsent: request.tcpaConsent,
    submittedAt: request.submittedAt,
  });
}
