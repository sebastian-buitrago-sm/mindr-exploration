import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { RemovalRequestRecord } from '../../domain/entities/RemovalRequestRecord';
import { IRemovalRequestRepository } from '../../domain/ports/IRemovalRequestRepository';

export class DynamoRemovalRequestRepository implements IRemovalRequestRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(tableName: string, dynamoClient?: DynamoDBClient) {
    const base = dynamoClient ?? new DynamoDBClient({});
    this.client = DynamoDBDocumentClient.from(base);
    this.tableName = tableName;
  }

  async save(record: RemovalRequestRecord): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: record,
      })
    );
  }

  async findAll(): Promise<RemovalRequestRecord[]> {
    const result = await this.client.send(
      new ScanCommand({ TableName: this.tableName })
    );

    const items = (result.Items ?? []) as RemovalRequestRecord[];
    return items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }
}
