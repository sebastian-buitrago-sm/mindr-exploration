export interface RemovalRequest {
  fullName: string;
  phoneNumber: string; // E.164 format
  tcpaConsent: true;
  submittedAt: string; // ISO 8601
}
