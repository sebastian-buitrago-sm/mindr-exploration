import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetRemovalRequestsUseCase } from '../../application/useCases/GetRemovalRequestsUseCase';
import { DynamoRemovalRequestRepository } from '../../infrastructure/dynamo/DynamoRemovalRequestRepository';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (
  _event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const tableName = process.env.DYNAMODB_TABLE_NAME ?? 'intoxalock-removal-requests';
    const repository = new DynamoRemovalRequestRepository(tableName);
    const useCase = new GetRemovalRequestsUseCase(repository);
    const records = await useCase.execute();

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ records }),
    };
  } catch {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to fetch records', code: 'INTERNAL_ERROR' }),
    };
  }
};
