import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../../../src/presentation/handlers/callRequestHandler';

jest.mock('../../../src/application/useCases/InitiateCallUseCase', () => ({
  InitiateCallUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      conversationId: 'conv_test',
      callSid: 'CA_test',
    }),
  })),
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
  submittedAt: '2026-06-10T14:00:00.000Z',
};

describe('callRequestHandler', () => {
  it('(a) valid body → 200 with conversationId, callSid, message', async () => {
    const res = await handler(makeEvent(validBody));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body as string);
    expect(body.conversationId).toBe('conv_test');
    expect(body.callSid).toBe('CA_test');
  });

  it('(b) missing shopPhone → 400 VALIDATION_ERROR', async () => {
    const res = await handler(makeEvent({ ...validBody, shopPhone: undefined }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string).code).toBe('VALIDATION_ERROR');
  });

  it('(c) customerSlots with 5 items → 400 VALIDATION_ERROR', async () => {
    const res = await handler(makeEvent({ ...validBody, customerSlots: ['a', 'b', 'c', 'd', 'e'] }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string).code).toBe('VALIDATION_ERROR');
  });

  it('(d) empty customerSlots → 400 VALIDATION_ERROR', async () => {
    const res = await handler(makeEvent({ ...validBody, customerSlots: [] }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string).code).toBe('VALIDATION_ERROR');
  });

  it('(e) CORS headers present on all responses', async () => {
    const res = await handler(makeEvent(validBody));
    expect(res.headers?.['Access-Control-Allow-Origin']).toBe('*');
  });
});
