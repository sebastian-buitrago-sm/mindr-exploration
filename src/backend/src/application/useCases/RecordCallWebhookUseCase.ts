import { IRemovalRequestRepository } from '../../domain/ports/IRemovalRequestRepository';
import { RemovalRequestRecord } from '../../domain/entities/RemovalRequestRecord';

interface DataCollectionResult {
  value?: string;
}

// ElevenLabs post-call webhook format
interface PostCallWebhookPayload {
  data?: {
    conversation_id?: string;
    data_collection_results?: {
      user_name?: DataCollectionResult;
      contact_info?: DataCollectionResult;
      slot_1?: DataCollectionResult;
      slot_2?: DataCollectionResult;
    };
  };
}

// ElevenLabs client tool call format (flat body sent during conversation)
interface ToolCallPayload {
  conversation_id?: string;
  user_name?: string;
  contact_info?: string;
  slot_1?: string;
  slot_2?: string;
}

type WebhookPayload = PostCallWebhookPayload & ToolCallPayload;

function extractFields(payload: WebhookPayload): {
  callId: string;
  userName: string;
  contactInfo: string;
  slot1: string;
  slot2: string;
} {
  // Try post-call webhook format first (nested data_collection_results)
  if (payload.data?.data_collection_results) {
    const results = payload.data.data_collection_results;
    return {
      callId: payload.data.conversation_id ?? '',
      userName: results.user_name?.value ?? '',
      contactInfo: results.contact_info?.value ?? '',
      slot1: results.slot_1?.value ?? '',
      slot2: results.slot_2?.value ?? '',
    };
  }

  // Fall back to flat tool call format
  return {
    callId: payload.conversation_id ?? '',
    userName: payload.user_name ?? '',
    contactInfo: payload.contact_info ?? '',
    slot1: payload.slot_1 ?? '',
    slot2: payload.slot_2 ?? '',
  };
}

export class RecordCallWebhookUseCase {
  constructor(private readonly repository: IRemovalRequestRepository) {}

  async execute(payload: WebhookPayload): Promise<void> {
    const { callId, userName, contactInfo, slot1, slot2 } = extractFields(payload);

    if (!callId || !userName || !contactInfo || !slot1 || !slot2) {
      return;
    }

    const record: RemovalRequestRecord = {
      callId,
      submittedAt: new Date().toISOString(),
      userName,
      contactInfo,
      slot1,
      slot2,
    };

    await this.repository.save(record);
  }
}
