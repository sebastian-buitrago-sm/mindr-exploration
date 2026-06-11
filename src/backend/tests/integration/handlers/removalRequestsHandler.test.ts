import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../../src/presentation/handlers/removalRequestsHandler';
import type { CallRecord } from '../../../src/domain/entities/CallRecord';

type Res = APIGatewayProxyStructuredResultV2;

const mockFindAll = jest.fn();

jest.mock('../../../src/infrastructure/dynamo/DynamoCallRecordRepository', () => ({
  DynamoCallRecordRepository: jest.fn().mockImplementation(() => ({
    findAll: mockFindAll,
    save: jest.fn(),
  })),
}));

function makeRecord(callId: string, submittedAt: string): CallRecord {
  return {
    callId,
    submittedAt,
    shopPhone: '+12065550100',
    customerSlots: JSON.stringify(['slot1']),
    status: 'confirmed',
    confirmedSlot: 'October 10th 2026 at 10:00am',
  };
}

describe('removalRequestsHandler — sort order (T033)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('records[0].submittedAt is the latest timestamp', async () => {
    const r1 = makeRecord('conv_a', '2026-06-10T08:00:00.000Z');
    const r2 = makeRecord('conv_b', '2026-06-10T14:00:00.000Z');
    const r3 = makeRecord('conv_c', '2026-06-10T11:00:00.000Z');

    mockFindAll.mockResolvedValueOnce([r2, r3, r1]);

    const res = (await handler({ headers: {} } as unknown as APIGatewayProxyEventV2)) as Res;
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body as string);
    expect(body.records[0].submittedAt).toBe('2026-06-10T14:00:00.000Z');
  });
});
