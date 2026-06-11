import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { CallRecord } from '../../domain/entities/CallRecord';
import type { ICallRecordRepository } from '../../domain/ports/ICallRecordRepository';

export class DynamoCallRecordRepository implements ICallRecordRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(tableName: string, dynamoClient?: DynamoDBClient) {
    const base = dynamoClient ?? new DynamoDBClient({});
    this.client = DynamoDBDocumentClient.from(base);
    this.tableName = tableName;
  }

  async save(record: CallRecord): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: record,
      })
    );
  }

  async updateStatus(
    callId: string,
    status: CallRecord['status'],
    confirmedSlot?: string,
    shopSuggestedSlots?: string
  ): Promise<void> {
    const updates: string[] = ['#st = :status'];
    const names: Record<string, string> = { '#st': 'status' };
    const values: Record<string, unknown> = { ':status': status };

    if (confirmedSlot !== undefined) {
      updates.push('confirmedSlot = :cs');
      values[':cs'] = confirmedSlot;
    }
    if (shopSuggestedSlots !== undefined) {
      updates.push('shopSuggestedSlots = :sss');
      values[':sss'] = shopSuggestedSlots;
    }

    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { callId },
        UpdateExpression: `SET ${updates.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );
  }

  async findLatestInProgressByShopPhone(shopPhone: string): Promise<CallRecord | null> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'shopPhone = :sp AND #st = :status',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':sp': shopPhone, ':status': 'in_progress' },
      })
    );
    const items = (result.Items ?? []) as CallRecord[];
    if (items.length === 0) return null;
    return items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  }

  async findAll(): Promise<CallRecord[]> {
    const result = await this.client.send(
      new ScanCommand({ TableName: this.tableName })
    );

    const items = (result.Items ?? []) as CallRecord[];
    return items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }
}
