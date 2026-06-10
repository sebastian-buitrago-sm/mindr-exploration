import type { ICallService } from '../../domain/ports/ICallService';
import type { RemovalRequest } from '../../domain/entities/RemovalRequest';
import type { CallRecord } from '../../domain/entities/CallRecord';
import { CallServiceError } from '../../domain/errors/DomainErrors';

export class ElevenLabsCallService implements ICallService {
  async initiateCall(request: RemovalRequest): Promise<CallRecord> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const agentPhoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;

    if (!apiKey || !agentId || !agentPhoneNumberId) {
      throw new CallServiceError('ElevenLabs credentials are not configured');
    }

    const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: agentPhoneNumberId,
        to_number: request.phoneNumber,
      }),
    });

    if (!response.ok) {
      throw new CallServiceError('Failed to initiate call. Please try again.');
    }

    const data = await response.json() as {
      conversation_id: string;
      callSid: string;
      success?: boolean;
      message?: string;
    };

    return {
      conversationId: data.conversation_id,
      callSid: data.callSid,
      success: data.success ?? true,
      message: data.message ?? 'Call initiated',
      initiatedAt: new Date().toISOString(),
    };
  }
}
