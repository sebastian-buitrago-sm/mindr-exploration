import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoRemovalRequestRepository } from '../../../src/infrastructure/dynamo/DynamoRemovalRequestRepository';
import { RemovalRequestRecord } from '../../../src/domain/entities/RemovalRequestRecord';

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb');
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: jest.fn(),
    },
    PutCommand: actual.PutCommand,
    ScanCommand: actual.ScanCommand,
  };
});

const mockSend = jest.fn();

describe('DynamoRemovalRequestRepository', () => {
  const TABLE = 'test-table';

  beforeEach(() => {
    jest.clearAllMocks();
    (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue({ send: mockSend });
  });

  const record1: RemovalRequestRecord = {
    callId: 'conv_001',
    submittedAt: '2026-06-10T10:00:00.000Z',
    userName: 'Alice',
    contactInfo: '+15550001111',
    slot1: 'Monday at 9am',
    slot2: 'Tuesday at 10am',
  };

  const record2: RemovalRequestRecord = {
    callId: 'conv_002',
    submittedAt: '2026-06-10T12:00:00.000Z',
    userName: 'Bob',
    contactInfo: '+15550002222',
    slot1: 'Wednesday at 1pm',
    slot2: 'Thursday at 2pm',
  };

  describe('save', () => {
    it('calls DynamoDB PutCommand with the record', async () => {
      mockSend.mockResolvedValueOnce({});
      const repo = new DynamoRemovalRequestRepository(TABLE, new DynamoDBClient({}));
      await repo.save(record1);
      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.input).toEqual({ TableName: TABLE, Item: record1 });
    });
  });

  describe('findAll', () => {
    it('returns records sorted descending by submittedAt', async () => {
      mockSend.mockResolvedValueOnce({ Items: [record1, record2] });
      const repo = new DynamoRemovalRequestRepository(TABLE, new DynamoDBClient({}));
      const result = await repo.findAll();
      expect(result).toHaveLength(2);
      expect(result[0].callId).toBe('conv_002');
      expect(result[1].callId).toBe('conv_001');
    });

    it('returns empty array when table is empty', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      const repo = new DynamoRemovalRequestRepository(TABLE, new DynamoDBClient({}));
      const result = await repo.findAll();
      expect(result).toEqual([]);
    });
  });
});
