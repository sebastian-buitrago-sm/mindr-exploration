import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

type APIGatewayProxyResultV2 = APIGatewayProxyStructuredResultV2;
import { z } from 'zod';
import { InitiateRemovalCallUseCase } from '../../application/useCases/InitiateRemovalCallUseCase';
import { ElevenLabsCallService } from '../../infrastructure/elevenlabs/ElevenLabsCallService';
import { ValidationError, CallServiceError } from '../../domain/errors/DomainErrors';

const requestSchema = z.object({
  fullName: z.string().min(1).max(100),
  phoneNumber: z.string().regex(/^\+[1-9]\d{6,14}$/),
  tcpaConsent: z.literal(true),
  submittedAt: z.string(),
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function errorResponse(statusCode: number, error: string, code: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error, code }),
  };
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
    const firstError = validation.error.issues[0];
    return errorResponse(400, firstError?.message ?? 'Validation failed', 'VALIDATION_ERROR');
  }

  const request = validation.data;

  try {
    const callService = new ElevenLabsCallService();
    const useCase = new InitiateRemovalCallUseCase(callService);
    const callRecord = await useCase.execute(request);

    console.log(JSON.stringify({ submittedAt: request.submittedAt, status: 'success' }));

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        conversationId: callRecord.conversationId,
        callSid: callRecord.callSid,
        message: callRecord.message,
      }),
    };
  } catch (err) {
    if (err instanceof ValidationError) {
      return errorResponse(400, err.message, err.code);
    }
    if (err instanceof CallServiceError) {
      console.error(JSON.stringify({ submittedAt: request.submittedAt, status: 'error', code: err.code }));
      return errorResponse(502, 'Failed to initiate call. Please try again.', err.code);
    }
    console.error(JSON.stringify({ submittedAt: request.submittedAt, status: 'unknown_error' }));
    return errorResponse(500, 'An unexpected error occurred', 'INTERNAL_ERROR');
  }
};
