import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { RecordCallWebhookUseCase } from '../../application/useCases/RecordCallWebhookUseCase';
import { DynamoCallRecordRepository } from '../../infrastructure/dynamo/DynamoCallRecordRepository';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

function errorResponse(statusCode: number, error: string, code: string): APIGatewayProxyResultV2 {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify({ error, code }) };
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(event.body ?? '') as Record<string, unknown>;
  } catch {
    return errorResponse(400, 'Invalid JSON body', 'VALIDATION_ERROR');
  }

  // RecordCallWebhookUseCase handles all payload formats.
  // If conversation_id is absent (ElevenLabs tool limitation), a new UUID is generated.
  const hasConversationId =
    !!(payload.conversation_id) ||
    !!(payload.data as Record<string, unknown> | undefined)?.conversation_id;
  if (!hasConversationId) {
    console.warn(JSON.stringify({ warning: 'webhook_received_without_conversation_id', payload }));
  }

  try {
    const tableName = process.env.DYNAMODB_TABLE_NAME ?? 'intoxalock-removal-requests';
    const repository = new DynamoCallRecordRepository(tableName);
    const useCase = new RecordCallWebhookUseCase(repository);
    await useCase.execute(payload as Parameters<typeof useCase.execute>[0]);

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ message: 'ok' }) };
  } catch {
    return errorResponse(500, 'Internal error', 'INTERNAL_ERROR');
  }
};
