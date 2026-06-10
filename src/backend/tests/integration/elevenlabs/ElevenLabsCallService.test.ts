import { ElevenLabsCallService } from '../../../src/infrastructure/elevenlabs/ElevenLabsCallService';
import type { RemovalRequest } from '../../../src/domain/entities/RemovalRequest';

describe('ElevenLabsCallService (integration)', () => {
  const mockRequest: RemovalRequest = {
    fullName: 'Jane Smith',
    phoneNumber: '+15551234567',
    tcpaConsent: true,
    submittedAt: '2026-06-10T14:30:00.000Z',
  };

  beforeEach(() => {
    process.env.ELEVENLABS_API_KEY = 'test-api-key';
    process.env.ELEVENLABS_AGENT_ID = 'test-agent-id';
    process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID = 'test-phone-number-id';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_AGENT_ID;
    delete process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;
  });

  it('calls POST https://api.elevenlabs.io/v1/convai/twilio/outbound-call with correct headers and body', async () => {
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Call initiated',
        conversation_id: 'conv_abc123',
        callSid: 'CA1234567890abcdef',
      }),
    } as Response);

    const service = new ElevenLabsCallService();
    await service.initiateCall(mockRequest);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.elevenlabs.io/v1/convai/twilio/outbound-call',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'xi-api-key': 'test-api-key',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          agent_id: 'test-agent-id',
          agent_phone_number_id: 'test-phone-number-id',
          to_number: '+15551234567',
        }),
      })
    );
  });

  it('returns a CallRecord with conversationId and callSid on success', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Call initiated',
        conversation_id: 'conv_abc123',
        callSid: 'CA1234567890abcdef',
      }),
    } as Response);

    const service = new ElevenLabsCallService();
    const result = await service.initiateCall(mockRequest);

    expect(result.conversationId).toBe('conv_abc123');
    expect(result.callSid).toBe('CA1234567890abcdef');
    expect(result.success).toBe(true);
  });

  it('throws CallServiceError when ElevenLabs returns non-ok response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    } as Response);

    const service = new ElevenLabsCallService();
    await expect(service.initiateCall(mockRequest)).rejects.toThrow();
  });
});
