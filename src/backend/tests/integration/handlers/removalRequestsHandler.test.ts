import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../../src/presentation/handlers/removalRequestsHandler';
import { RemovalRequestRecord } from '../../../src/domain/entities/RemovalRequestRecord';

const mockFindAll = jest.fn();

jest.mock('../../../src/infrastructure/dynamo/DynamoRemovalRequestRepository', () => ({
  DynamoRemovalRequestRepository: jest.fn().mockImplementation(() => ({
    findAll: mockFindAll,
    save: jest.fn(),
  })),
}));

describe('removalRequestsHandler — sort order (US3)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns records with most recent submittedAt first', async () => {
    const oldest: RemovalRequestRecord = {
      callId: 'conv_001',
      submittedAt: '2026-06-10T08:00:00.000Z',
      userName: 'Alice',
      contactInfo: '+15551111111',
      slot1: 'Monday at 9am',
      slot2: 'Tuesday at 10am',
    };
    const middle: RemovalRequestRecord = {
      callId: 'conv_002',
      submittedAt: '2026-06-10T10:00:00.000Z',
      userName: 'Bob',
      contactInfo: '+15552222222',
      slot1: 'Wednesday at 1pm',
      slot2: 'Thursday at 2pm',
    };
    const newest: RemovalRequestRecord = {
      callId: 'conv_003',
      submittedAt: '2026-06-10T12:00:00.000Z',
      userName: 'Carol',
      contactInfo: '+15553333333',
      slot1: 'Friday at 3pm',
      slot2: 'Saturday at 4pm',
    };

    mockFindAll.mockResolvedValueOnce([newest, oldest, middle]);

    const event = { headers: {} } as Partial<APIGatewayProxyEventV2>;
    const result = (await handler(event as APIGatewayProxyEventV2)) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body as string);
    expect(body.records).toHaveLength(3);
    expect(body.records[0].submittedAt).toBe('2026-06-10T12:00:00.000Z');
  });
});
