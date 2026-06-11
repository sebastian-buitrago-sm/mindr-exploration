export interface CallRecord {
  callId: string;
  submittedAt: string;
  shopPhone: string;
  customerSlots: string;       // JSON-serialized string[]
  status: 'confirmed' | 'needs_recontact' | 'failed' | 'in_progress';
  confirmedSlot?: string;
  shopSuggestedSlots?: string; // JSON-serialized string[]
}
