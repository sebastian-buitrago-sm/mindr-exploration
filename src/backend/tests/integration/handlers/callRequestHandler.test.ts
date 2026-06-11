import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../../src/presentation/handlers/callRequestHandler';

type Res = APIGatewayProxyStructuredResultV2;

const mockExecute = jest.fn();
jest.mock('../../../src/application/useCases/InitiateCallUseCase', () => ({
  InitiateCallUseCase: jest.fn().mockImplementation(() => ({ execute: mockExecute })),
}));

jest.mock('../../../src/infrastructure/dynamo/DynamoCallRecordRepository', () => ({
  DynamoCallRecordRepository: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn().mockResolvedValue([]),
  })),
}));

const makeEvent = (body: unknown): APIGatewayProxyEventV2 =>
  ({
    body: JSON.stringify(body),
    headers: {},
    requestContext: { http: { method: 'POST' } },
  }) as unknown as APIGatewayProxyEventV2;

const validBody = {
  shopPhone: '+12065550100',
  customerSlots: ['October 10th 2026 at 10:00am', 'October 11th 2026 at 2:00pm'],
  submittedAt: '2026-06-10T14:30:00.000Z',
};

describe('callRequestHandler (integration)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns HTTP 200 with conversationId for valid payload', async () => {
    mockExecute.mockResolvedValueOnce({ conversationId: 'conv_abc123', callSid: 'CA_test' });
    const res = (await handler(makeEvent(validBody))) as Res;
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body as string).conversationId).toBe('conv_abc123');
  });

  it('returns 400 for missing shopPhone', async () => {
    const res = (await handler(makeEvent({ ...validBody, shopPhone: undefined }))) as Res;
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for empty customerSlots', async () => {
    const res = (await handler(makeEvent({ ...validBody, customerSlots: [] }))) as Res;
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for customerSlots with more than 4 items', async () => {
    const res = (await handler(makeEvent({ ...validBody, customerSlots: ['a', 'b', 'c', 'd', 'e'] }))) as Res;
    expect(res.statusCode).toBe(400);
  });

  it('returns 502 when use case throws CallServiceError', async () => {
    const { CallServiceError } = await import('../../../src/domain/errors/DomainErrors');
    mockExecute.mockRejectedValueOnce(new CallServiceError('ElevenLabs failed'));
    const res = (await handler(makeEvent(validBody))) as Res;
    expect(res.statusCode).toBe(502);
  });
});
