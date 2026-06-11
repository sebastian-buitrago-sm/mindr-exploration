import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../../src/presentation/handlers/removalRequestsHandler';

jest.mock('../../../src/infrastructure/dynamo/DynamoRemovalRequestRepository');

const mockExecute = jest.fn();
jest.mock('../../../src/application/useCases/GetRemovalRequestsUseCase', () => ({
  GetRemovalRequestsUseCase: jest.fn().mockImplementation(() => ({
    execute: mockExecute,
  })),
}));

const makeEvent = (): Partial<APIGatewayProxyEventV2> => ({
  headers: { accept: 'application/json' },
});

describe('removalRequestsHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with records array', async () => {
    const records = [
      {
        callId: 'conv_001',
        submittedAt: '2026-06-10T12:00:00.000Z',
        userName: 'Alice',
        contactInfo: '+15551111111',
        slot1: 'Monday at 9am',
        slot2: 'Tuesday at 10am',
      },
    ];
    mockExecute.mockResolvedValueOnce(records);
    const result = (await handler(makeEvent() as APIGatewayProxyEventV2)) as APIGatewayProxyStructuredResultV2;
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body as string);
    expect(body.records).toHaveLength(1);
    expect(body.records[0].callId).toBe('conv_001');
  });

  it('returns 200 with empty records array when none exist', async () => {
    mockExecute.mockResolvedValueOnce([]);
    const result = (await handler(makeEvent() as APIGatewayProxyEventV2)) as APIGatewayProxyStructuredResultV2;
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body as string);
    expect(body.records).toEqual([]);
  });

  it('includes CORS headers in the response', async () => {
    mockExecute.mockResolvedValueOnce([]);
    const result = (await handler(makeEvent() as APIGatewayProxyEventV2)) as APIGatewayProxyStructuredResultV2;
    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin');
  });
});
