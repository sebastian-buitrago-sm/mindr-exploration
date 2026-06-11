import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../../src/presentation/handlers/webhookHandler';

type Res = APIGatewayProxyStructuredResultV2;

jest.mock('../../../src/application/useCases/RecordCallWebhookUseCase', () => ({
  RecordCallWebhookUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue(undefined),
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
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {},
    requestContext: { http: { method: 'POST' } },
  }) as unknown as APIGatewayProxyEventV2;

const validPayload = {
  data: {
    conversation_id: 'conv_abc123',
    data_collection_results: {
      confirmed_slot: { value: 'October 10th 2026 at 10:00am' },
      shop_suggested_slot_1: { value: '' },
      shop_suggested_slot_2: { value: '' },
    },
  },
};

describe('webhookHandler', () => {
  it('(a) valid payload with confirmed_slot → 200 {"message":"ok"}', async () => {
    const res = (await handler(makeEvent(validPayload))) as Res;
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body as string).message).toBe('ok');
  });

  it('(b) valid payload with all empty results → 200', async () => {
    const res = (await handler(makeEvent({
      data: {
        conversation_id: 'conv_empty',
        data_collection_results: {
          confirmed_slot: { value: '' },
          shop_suggested_slot_1: { value: '' },
          shop_suggested_slot_2: { value: '' },
        },
      },
    }))) as Res;
    expect(res.statusCode).toBe(200);
  });

  it('(c) malformed JSON body → 400 VALIDATION_ERROR', async () => {
    const res = (await handler(makeEvent('not-json'))) as Res;
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body as string).code).toBe('VALIDATION_ERROR');
  });

  it('(d) missing conversation_id → 200 (use case falls back to UUID)', async () => {
    const res = (await handler(makeEvent({ data: { data_collection_results: {} } }))) as Res;
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body as string).message).toBe('ok');
  });

  it('(e) CORS headers present', async () => {
    const res = (await handler(makeEvent(validPayload))) as Res;
    expect(res.headers?.['Access-Control-Allow-Origin']).toBe('*');
  });
});
