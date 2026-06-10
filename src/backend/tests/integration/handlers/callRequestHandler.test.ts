import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../../../src/presentation/handlers/callRequestHandler';
import { CallServiceError } from '../../../src/domain/errors/DomainErrors';

jest.mock('../../../src/infrastructure/elevenlabs/ElevenLabsCallService');

const makeEvent = (body: unknown): APIGatewayProxyEventV2 =>
  ({
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    requestContext: { http: { method: 'POST' } },
  }) as unknown as APIGatewayProxyEventV2;

describe('callRequestHandler (integration)', () => {
  const validBody = {
    fullName: 'Jane Smith',
    phoneNumber: '+15551234567',
    tcpaConsent: true,
    submittedAt: '2026-06-10T14:30:00.000Z',
  };

  beforeEach(() => {
    process.env.ELEVENLABS_API_KEY = 'test-key';
    process.env.ELEVENLABS_AGENT_ID = 'test-agent';
    process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID = 'test-phone';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns HTTP 200 with conversationId for valid payload', async () => {
    const { ElevenLabsCallService } = await import(
      '../../../src/infrastructure/elevenlabs/ElevenLabsCallService'
    );
    (ElevenLabsCallService as jest.Mock).mockImplementation(() => ({
      initiateCall: jest.fn().mockResolvedValue({
        conversationId: 'conv_abc123',
        callSid: 'CA1234567890abcdef',
        success: true,
        message: 'Call initiated',
        initiatedAt: '2026-06-10T14:30:00.000Z',
      }),
    }));

    const response = await handler(makeEvent(validBody));
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body as string);
    expect(body.conversationId).toBe('conv_abc123');
  });

  it('returns 400 for missing fullName', async () => {
    const response = await handler(
      makeEvent({ phoneNumber: '+15551234567', tcpaConsent: true, submittedAt: '2026-06-10T14:30:00.000Z' })
    );
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body as string);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid phoneNumber format', async () => {
    const response = await handler(
      makeEvent({ fullName: 'Jane', phoneNumber: '5551234567', tcpaConsent: true, submittedAt: '2026-06-10T14:30:00.000Z' })
    );
    expect(response.statusCode).toBe(400);
  });

  it('returns 400 for tcpaConsent: false', async () => {
    const response = await handler(
      makeEvent({ fullName: 'Jane', phoneNumber: '+15551234567', tcpaConsent: false, submittedAt: '2026-06-10T14:30:00.000Z' })
    );
    expect(response.statusCode).toBe(400);
  });

  it('returns 502 when ICallService throws CallServiceError', async () => {
    const { ElevenLabsCallService } = await import(
      '../../../src/infrastructure/elevenlabs/ElevenLabsCallService'
    );
    (ElevenLabsCallService as jest.Mock).mockImplementation(() => ({
      initiateCall: jest.fn().mockRejectedValue(new CallServiceError('ElevenLabs failed')),
    }));

    const response = await handler(makeEvent(validBody));
    expect(response.statusCode).toBe(502);
  });
});
