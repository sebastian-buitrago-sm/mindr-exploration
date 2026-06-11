import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../../src/presentation/handlers/webhookHandler';

jest.mock('../../../src/infrastructure/dynamo/DynamoRemovalRequestRepository');
jest.mock('../../../src/application/useCases/RecordCallWebhookUseCase', () => ({
  RecordCallWebhookUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue(undefined),
  })),
}));

const makeEvent = (body: string | null): Partial<APIGatewayProxyEventV2> => ({
  body: body ?? undefined,
  headers: { 'content-type': 'application/json' },
});

describe('webhookHandler', () => {
  it('returns 200 with {"message":"ok"} for a valid payload', async () => {
    const payload = JSON.stringify({
      type: 'post_call_transcription',
      data: {
        conversation_id: 'conv_abc123',
        data_collection_results: {
          user_name: { value: 'Jane' },
          contact_info: { value: '+1555' },
          slot_1: { value: 'slot1' },
          slot_2: { value: 'slot2' },
        },
      },
    });
    const result = (await handler(makeEvent(payload) as APIGatewayProxyEventV2)) as APIGatewayProxyStructuredResultV2;
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({ message: 'ok' });
  });

  it('returns 400 for malformed JSON', async () => {
    const result = (await handler(makeEvent('not-json') as APIGatewayProxyEventV2)) as APIGatewayProxyStructuredResultV2;
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 200 (no save) when required fields are missing', async () => {
    const payload = JSON.stringify({
      data: {
        conversation_id: 'conv_xyz',
        data_collection_results: {
          user_name: { value: '' },
          contact_info: { value: '' },
          slot_1: { value: '' },
          slot_2: { value: '' },
        },
      },
    });
    const result = (await handler(makeEvent(payload) as APIGatewayProxyEventV2)) as APIGatewayProxyStructuredResultV2;
    expect(result.statusCode).toBe(200);
  });

  it('includes CORS headers in the response', async () => {
    const payload = JSON.stringify({ data: { conversation_id: 'c', data_collection_results: {} } });
    const result = (await handler(makeEvent(payload) as APIGatewayProxyEventV2)) as APIGatewayProxyStructuredResultV2;
    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin');
  });
});
