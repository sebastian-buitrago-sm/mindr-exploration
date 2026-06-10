import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitRemovalRequest } from '../../../src/application/useCases/submitRemovalRequest';
import * as callRequestClient from '../../../src/infrastructure/api/callRequestClient';
import type { RemovalRequest } from '../../../src/domain/entities/RemovalRequest';
import type { CallRecord } from '../../../src/domain/entities/CallRecord';

vi.mock('../../../src/infrastructure/api/callRequestClient');

describe('submitRemovalRequest', () => {
  const mockRequest: RemovalRequest = {
    fullName: 'Jane Smith',
    countryCode: 'US',
    dialCode: '+1',
    localPhoneNumber: '5551234567',
    phoneNumber: '+15551234567',
    tcpaConsent: true,
    submittedAt: '2026-06-10T14:30:00.000Z',
  };

  const mockCallRecord: CallRecord = {
    conversationId: 'conv_abc123',
    callSid: 'CA1234567890abcdef',
    message: 'Call initiated',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls callRequestClient with the assembled payload and returns CallRecord', async () => {
    vi.spyOn(callRequestClient, 'postCallRequest').mockResolvedValue(mockCallRecord);

    const result = await submitRemovalRequest(mockRequest);

    expect(callRequestClient.postCallRequest).toHaveBeenCalledWith({
      fullName: mockRequest.fullName,
      phoneNumber: mockRequest.phoneNumber,
      tcpaConsent: mockRequest.tcpaConsent,
      submittedAt: mockRequest.submittedAt,
    });
    expect(result).toEqual(mockCallRecord);
  });

  it('propagates errors from callRequestClient', async () => {
    vi.spyOn(callRequestClient, 'postCallRequest').mockRejectedValue(new Error('Network error'));

    await expect(submitRemovalRequest(mockRequest)).rejects.toThrow('Network error');
  });
});
