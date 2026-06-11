import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler } from '../../../src/presentation/handlers/removalRequestsHandler';
import type { CallRecord } from '../../../src/domain/entities/CallRecord';

type Res = APIGatewayProxyStructuredResultV2;

const mockExecute = jest.fn();
jest.mock('../../../src/application/useCases/GetCallRecordsUseCase', () => ({
  GetCallRecordsUseCase: jest.fn().mockImplementation(() => ({ execute: mockExecute })),
}));

jest.mock('../../../src/infrastructure/dynamo/DynamoCallRecordRepository', () => ({
  DynamoCallRecordRepository: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn().mockResolvedValue([]),
  })),
}));

const makeEvent = (): APIGatewayProxyEventV2 =>
  ({ headers: {} }) as unknown as APIGatewayProxyEventV2;

const sampleRecords: CallRecord[] = [
  {
    callId: 'conv_001',
    submittedAt: '2026-06-10T12:00:00.000Z',
    shopPhone: '+12065550100',
    customerSlots: JSON.stringify(['slot1']),
    status: 'confirmed',
    confirmedSlot: 'October 10th 2026 at 10:00am',
  },
];

describe('removalRequestsHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('(a) returns {"records":[...]} with HTTP 200', async () => {
    mockExecute.mockResolvedValueOnce(sampleRecords);
    const res = (await handler(makeEvent())) as Res;
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body as string);
    expect(body.records).toHaveLength(1);
    expect(body.records[0].callId).toBe('conv_001');
  });

  it('(b) returns {"records":[]} when store is empty', async () => {
    mockExecute.mockResolvedValueOnce([]);
    const res = (await handler(makeEvent())) as Res;
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body as string).records).toEqual([]);
  });

  it('(c) CORS headers present', async () => {
    mockExecute.mockResolvedValueOnce([]);
    const res = (await handler(makeEvent())) as Res;
    expect(res.headers?.['Access-Control-Allow-Origin']).toBe('*');
  });
});
