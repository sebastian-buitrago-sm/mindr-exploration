import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { RecordCallWebhookUseCase } from '../../application/useCases/RecordCallWebhookUseCase';
import { DynamoRemovalRequestRepository } from '../../infrastructure/dynamo/DynamoRemovalRequestRepository';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  let payload: unknown;

  try {
    payload = JSON.parse(event.body ?? '');
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid payload', code: 'VALIDATION_ERROR' }),
    };
  }

  try {
    const tableName = process.env.DYNAMODB_TABLE_NAME ?? 'intoxalock-removal-requests';
    const repository = new DynamoRemovalRequestRepository(tableName);
    const useCase = new RecordCallWebhookUseCase(repository);
    await useCase.execute(payload as Record<string, unknown>);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'ok' }),
    };
  } catch {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal error', code: 'INTERNAL_ERROR' }),
    };
  }
};
