import { z } from 'zod';
import { ValidationError, CallServiceError } from '../../domain/errors/DomainErrors';
import type { ICallRecordRepository } from '../../domain/ports/ICallRecordRepository';

const inputSchema = z.object({
  shopPhone: z.string().min(1),
  customerSlots: z.array(z.string().min(1)).min(1).max(4),
  submittedAt: z.string(),
});

export type InitiateCallInput = z.infer<typeof inputSchema>;

export interface InitiateCallResult {
  conversationId: string;
  callSid: string;
}

export class InitiateCallUseCase {
  constructor(private readonly repository: ICallRecordRepository) {}

  async execute(input: InitiateCallInput): Promise<InitiateCallResult> {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { shopPhone, customerSlots, submittedAt } = parsed.data;

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const agentPhoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;

    if (!apiKey || !agentId || !agentPhoneNumberId) {
      throw new CallServiceError('ElevenLabs credentials not configured');
    }

    const dynamicVariables: Record<string, string> = {
      shop_phone: shopPhone,
    };
    customerSlots.forEach((slot, i) => {
      dynamicVariables[`slot_${i + 1}`] = slot;
    });

    const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: agentPhoneNumberId,
        to_number: shopPhone,
        conversation_initiation_client_data: {
          dynamic_variables: dynamicVariables,
        },
      }),
    });

    if (!response.ok) {
      throw new CallServiceError('Failed to initiate outbound call');
    }

    const data = await response.json() as { conversation_id: string; callSid?: string };
    const conversationId = data.conversation_id;
    const callSid = data.callSid ?? '';

    await this.repository.save({
      callId: conversationId,
      submittedAt,
      shopPhone,
      customerSlots: JSON.stringify(customerSlots),
      status: 'in_progress',
    });

    return { conversationId, callSid };
  }
}
