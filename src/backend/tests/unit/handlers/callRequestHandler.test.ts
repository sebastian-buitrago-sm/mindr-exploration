import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../../../src/presentation/handlers/callRequestHandler';

jest.mock('../../../src/infrastructure/elevenlabs/ElevenLabsCallService', () => ({
  ElevenLabsCallService: jest.fn().mockImplementation(() => ({
    initiateCall: jest.fn().mockResolvedValue({
      conversationId: 'conv_test',
      callSid: 'CA_test',
      success: true,
      message: 'Call initiated',
      initiatedAt: '2026-06-10T14:30:00.000Z',
    }),
  })),
}));

const makeEvent = (body: unknown): APIGatewayProxyEventV2 =>
  ({
    body: JSON.stringify(body),
    headers: {},
    requestContext: { http: { method: 'POST' } },
  }) as unknown as APIGatewayProxyEventV2;

describe('callRequestHandler validation', () => {
  it('returns 400 when fullName is missing', async () => {
    const response = await handler(
      makeEvent({ phoneNumber: '+15551234567', tcpaConsent: true, submittedAt: '2026-06-10T14:30:00.000Z' })
    );
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body as string).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when phoneNumber is not E.164', async () => {
    const response = await handler(
      makeEvent({ fullName: 'Jane', phoneNumber: '5551234567', tcpaConsent: true, submittedAt: '2026-06-10T14:30:00.000Z' })
    );
    expect(response.statusCode).toBe(400);
  });

  it('returns 400 when tcpaConsent is false', async () => {
    const response = await handler(
      makeEvent({ fullName: 'Jane', phoneNumber: '+15551234567', tcpaConsent: false, submittedAt: '2026-06-10T14:30:00.000Z' })
    );
    expect(response.statusCode).toBe(400);
  });

  it('returns 200 with valid payload', async () => {
    const response = await handler(
      makeEvent({ fullName: 'Jane', phoneNumber: '+15551234567', tcpaConsent: true, submittedAt: '2026-06-10T14:30:00.000Z' })
    );
    expect(response.statusCode).toBe(200);
  });
});
