import { randomUUID } from 'crypto';
import type { ICallRecordRepository } from '../../domain/ports/ICallRecordRepository';
import type { CallRecord } from '../../domain/entities/CallRecord';

interface DataCollectionResult {
  value?: string;
}

// Post-call webhook format (automatic, fired by ElevenLabs after call ends)
interface PostCallWebhookPayload {
  data?: {
    conversation_id?: string;
    data_collection_results?: {
      confirmed_slot?: DataCollectionResult;
      shop_suggested_slot_1?: DataCollectionResult;
      shop_suggested_slot_2?: DataCollectionResult;
    };
  };
}

// Webhook tool format (flat, sent mid-call when agent calls save_call_result tool)
interface ToolCallPayload {
  conversation_id?: string;
  confirmed_slot?: string;
  shop_suggested_slot_1?: string;
  shop_suggested_slot_2?: string;
}

type WebhookPayload = PostCallWebhookPayload & ToolCallPayload;

function extractFields(payload: WebhookPayload): {
  callId: string;
  confirmedSlot: string;
  shopSlot1: string;
  shopSlot2: string;
} {
  // Post-call webhook format: nested under data.data_collection_results
  if (payload.data?.data_collection_results) {
    const r = payload.data.data_collection_results;
    return {
      callId: payload.data.conversation_id ?? '',
      confirmedSlot: r.confirmed_slot?.value?.trim() ?? '',
      shopSlot1: r.shop_suggested_slot_1?.value?.trim() ?? '',
      shopSlot2: r.shop_suggested_slot_2?.value?.trim() ?? '',
    };
  }

  // Webhook tool format: flat payload sent during the call
  return {
    callId: payload.conversation_id ?? '',
    confirmedSlot: (payload.confirmed_slot ?? '').trim(),
    shopSlot1: (payload.shop_suggested_slot_1 ?? '').trim(),
    shopSlot2: (payload.shop_suggested_slot_2 ?? '').trim(),
  };
}

export class RecordCallWebhookUseCase {
  constructor(private readonly repository: ICallRecordRepository) {}

  async execute(payload: WebhookPayload): Promise<void> {
    const { callId, confirmedSlot, shopSlot1, shopSlot2 } = extractFields(payload);

    let status: CallRecord['status'];
    const extra: Partial<CallRecord> = {};

    if (confirmedSlot) {
      status = 'confirmed';
      extra.confirmedSlot = confirmedSlot;
    } else if (shopSlot1) {
      status = 'needs_recontact';
      extra.shopSuggestedSlots = JSON.stringify([shopSlot1, shopSlot2].filter(Boolean));
    } else {
      status = 'failed';
    }

    if (callId) {
      await this.repository.updateStatus(callId, status, extra.confirmedSlot, extra.shopSuggestedSlots);
    } else {
      // Tool call without conversation_id: find in_progress record by shopPhone
      const shopPhone = (payload as { shop_phone?: string }).shop_phone?.trim() ?? '';
      const existing = shopPhone
        ? await this.repository.findLatestInProgressByShopPhone(shopPhone)
        : null;

      if (existing) {
        await this.repository.updateStatus(existing.callId, status, extra.confirmedSlot, extra.shopSuggestedSlots);
      } else {
        await this.repository.save({
          callId: randomUUID(),
          submittedAt: new Date().toISOString(),
          shopPhone,
          customerSlots: '[]',
          status,
          ...extra,
        });
      }
    }
  }
}
