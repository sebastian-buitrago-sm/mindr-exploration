import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { InitiateCallUseCase } from '../../application/useCases/InitiateCallUseCase';
import { DynamoCallRecordRepository } from '../../infrastructure/dynamo/DynamoCallRecordRepository';
import { ValidationError, CallServiceError } from '../../domain/errors/DomainErrors';

type APIGatewayProxyResultV2 = APIGatewayProxyStructuredResultV2;

const requestSchema = z.object({
  shopPhone: z.string().min(1),
  customerSlots: z.array(z.string().min(1)).min(1).max(4),
  submittedAt: z.string(),
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function errorResponse(statusCode: number, error: string, code: string): APIGatewayProxyResultV2 {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify({ error, code }) };
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(event.body ?? '{}');
  } catch {
    return errorResponse(400, 'Invalid JSON body', 'VALIDATION_ERROR');
  }

  const validation = requestSchema.safeParse(parsed);
  if (!validation.success) {
    return errorResponse(400, validation.error.issues[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR');
  }

  const request = validation.data;

  try {
    const tableName = process.env.DYNAMODB_TABLE_NAME ?? 'intoxalock-removal-requests';
    const repository = new DynamoCallRecordRepository(tableName);
    const useCase = new InitiateCallUseCase(repository);
    const result = await useCase.execute(request);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        conversationId: result.conversationId,
        callSid: result.callSid,
        message: 'Call initiated successfully',
      }),
    };
  } catch (err) {
    if (err instanceof ValidationError) {
      return errorResponse(400, err.message, err.code);
    }
    if (err instanceof CallServiceError) {
      return errorResponse(502, 'Failed to initiate call. Please try again.', err.code);
    }
    return errorResponse(500, 'An unexpected error occurred', 'INTERNAL_ERROR');
  }
};
