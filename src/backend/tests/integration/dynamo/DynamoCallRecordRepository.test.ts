import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoCallRecordRepository } from '../../../src/infrastructure/dynamo/DynamoCallRecordRepository';
import type { CallRecord } from '../../../src/domain/entities/CallRecord';

const TABLE_NAME = 'intoxalock-removal-requests';

function makeRecord(overrides: Partial<CallRecord> = {}): CallRecord {
  return {
    callId: `conv_test_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    shopPhone: '+12065550100',
    customerSlots: JSON.stringify(['October 10th 2026 at 10:00am']),
    status: 'in_progress',
    ...overrides,
  };
}

describe('DynamoCallRecordRepository (integration)', () => {
  let repo: DynamoCallRecordRepository;
  let docClient: DynamoDBDocumentClient;
  const createdIds: Array<{ callId: string; submittedAt: string }> = [];

  beforeAll(() => {
    const client = new DynamoDBClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:8000',
    });
    docClient = DynamoDBDocumentClient.from(client);
    repo = new DynamoCallRecordRepository(TABLE_NAME, client);
  });

  afterEach(async () => {
    for (const key of createdIds) {
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { callId: key.callId, submittedAt: key.submittedAt },
      })).catch(() => {});
    }
    createdIds.length = 0;
  });

  it('saves a CallRecord and verifies it can be retrieved', async () => {
    const record = makeRecord({ callId: 'conv_save_test', status: 'in_progress' });
    createdIds.push({ callId: record.callId, submittedAt: record.submittedAt });

    await repo.save(record);

    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { callId: record.callId, submittedAt: record.submittedAt },
    }));

    expect(result.Item).toBeDefined();
    expect(result.Item?.status).toBe('in_progress');
    expect(result.Item?.shopPhone).toBe('+12065550100');
  });

  it('findAll returns records sorted by submittedAt descending', async () => {
    const r1 = makeRecord({ callId: 'conv_sort_1', submittedAt: '2026-06-10T10:00:00.000Z' });
    const r2 = makeRecord({ callId: 'conv_sort_2', submittedAt: '2026-06-10T12:00:00.000Z' });
    const r3 = makeRecord({ callId: 'conv_sort_3', submittedAt: '2026-06-10T08:00:00.000Z' });
    createdIds.push(
      { callId: r1.callId, submittedAt: r1.submittedAt },
      { callId: r2.callId, submittedAt: r2.submittedAt },
      { callId: r3.callId, submittedAt: r3.submittedAt }
    );

    await Promise.all([repo.save(r1), repo.save(r2), repo.save(r3)]);

    const all = await repo.findAll();
    const relevant = all.filter((r) => ['conv_sort_1', 'conv_sort_2', 'conv_sort_3'].includes(r.callId));

    expect(relevant[0].callId).toBe('conv_sort_2');
    expect(relevant[1].callId).toBe('conv_sort_1');
    expect(relevant[2].callId).toBe('conv_sort_3');
  });

  it('upserts: second save with same callId overwrites status', async () => {
    const record = makeRecord({ callId: 'conv_upsert_test', status: 'in_progress' });
    createdIds.push({ callId: record.callId, submittedAt: record.submittedAt });

    await repo.save(record);
    await repo.save({ ...record, status: 'confirmed', confirmedSlot: 'October 10th 2026 at 10:00am' });

    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { callId: record.callId, submittedAt: record.submittedAt },
    }));

    expect(result.Item?.status).toBe('confirmed');
    expect(result.Item?.confirmedSlot).toBe('October 10th 2026 at 10:00am');
  });
});
