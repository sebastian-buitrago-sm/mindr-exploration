export interface CallRecord {
  conversationId: string;
  callSid: string;
  success: boolean;
  message: string;
  initiatedAt: string; // ISO 8601
}
