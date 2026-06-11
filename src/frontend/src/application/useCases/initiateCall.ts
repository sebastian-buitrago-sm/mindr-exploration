import { postCallRequest, type CallRequestResponse } from '../../infrastructure/api/callRequestClient';

export interface InitiateCallInput {
  shopPhone: string;
  customerSlots: string[];
}

export async function initiateCall(input: InitiateCallInput): Promise<CallRequestResponse> {
  return postCallRequest({
    ...input,
    submittedAt: new Date().toISOString(),
  });
}
