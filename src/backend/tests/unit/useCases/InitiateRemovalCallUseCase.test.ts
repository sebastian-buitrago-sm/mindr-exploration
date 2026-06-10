import { InitiateRemovalCallUseCase } from '../../../src/application/useCases/InitiateRemovalCallUseCase';
import type { ICallService } from '../../../src/domain/ports/ICallService';
import type { RemovalRequest } from '../../../src/domain/entities/RemovalRequest';
import type { CallRecord } from '../../../src/domain/entities/CallRecord';

describe('InitiateRemovalCallUseCase', () => {
  const mockCallRecord: CallRecord = {
    conversationId: 'conv_test123',
    callSid: 'CA_test123',
    success: true,
    message: 'Call initiated',
    initiatedAt: '2026-06-10T14:30:00.000Z',
  };

  const mockRequest: RemovalRequest = {
    fullName: 'Jane Smith',
    phoneNumber: '+15551234567',
    tcpaConsent: true,
    submittedAt: '2026-06-10T14:30:00.000Z',
  };

  it('calls ICallService.initiateCall with the correct RemovalRequest', async () => {
    const mockCallService: ICallService = {
      initiateCall: jest.fn().mockResolvedValue(mockCallRecord),
    };

    const useCase = new InitiateRemovalCallUseCase(mockCallService);
    await useCase.execute(mockRequest);

    expect(mockCallService.initiateCall).toHaveBeenCalledWith(mockRequest);
    expect(mockCallService.initiateCall).toHaveBeenCalledTimes(1);
  });

  it('returns the CallRecord from ICallService', async () => {
    const mockCallService: ICallService = {
      initiateCall: jest.fn().mockResolvedValue(mockCallRecord),
    };

    const useCase = new InitiateRemovalCallUseCase(mockCallService);
    const result = await useCase.execute(mockRequest);

    expect(result).toEqual(mockCallRecord);
  });

  it('propagates errors from ICallService', async () => {
    const mockCallService: ICallService = {
      initiateCall: jest.fn().mockRejectedValue(new Error('Service unavailable')),
    };

    const useCase = new InitiateRemovalCallUseCase(mockCallService);

    await expect(useCase.execute(mockRequest)).rejects.toThrow('Service unavailable');
  });
});
