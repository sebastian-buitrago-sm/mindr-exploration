# Data Model: Intoxalock Device Removal Call Automation

**Date**: 2026-06-10

---

## Entities

### RemovalRequest

Represents the data submitted by the customer via the web form. Assembled on the frontend and sent to the backend as the API request payload.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `fullName` | `string` | Yes | Non-empty, max 100 chars | Customer's full name |
| `countryCode` | `string` | Yes | Valid ISO 3166-1 alpha-2 code | e.g., `"US"`, `"MX"` — selected via country selector |
| `dialCode` | `string` | Yes | Valid dial code prefix | e.g., `"+1"`, `"+52"` — derived from country selector |
| `localPhoneNumber` | `string` | Yes | Valid number for selected country (libphonenumber-js) | Digits entered by user, without dial code |
| `phoneNumber` | `string` | Yes | E.164 format | Concatenated by frontend: `dialCode + localPhoneNumber` |
| `tcpaConsent` | `boolean` | Yes | Must be `true` | TCPA consent checkbox; form cannot submit if `false` |
| `submittedAt` | `string` | Auto | ISO 8601 timestamp | Set by frontend at submission time |

**Backend receives only**: `fullName`, `phoneNumber` (E.164), `tcpaConsent`, `submittedAt`.
The country selector fields are frontend-only concerns used to assemble `phoneNumber`.

---

### CallRecord

Represents the result of a triggered outbound call, returned by the ElevenLabs API and surfaced to the customer on the confirmation screen.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `conversationId` | `string` | ElevenLabs response `conversation_id` | Unique call reference shown to customer |
| `callSid` | `string` | ElevenLabs response `callSid` | Twilio call identifier |
| `success` | `boolean` | ElevenLabs response `success` | Whether the call was successfully queued |
| `message` | `string` | ElevenLabs response `message` | Human-readable status from ElevenLabs |
| `initiatedAt` | `string` | Set by Lambda handler | ISO 8601 timestamp of call initiation |

---

## State Transitions

### Submission Flow (Frontend)

```
IDLE
  │  user fills form
  ▼
FORM_FILLING
  │  user clicks Submit (all fields valid + consent checked)
  ▼
SUBMITTING (button disabled, loading indicator)
  │
  ├─ success ──► CONFIRMED (show CallRecord.conversationId + static message)
  │
  └─ error ────► ERROR (show error message + one-click retry button)
                   │  user clicks Retry
                   └──► SUBMITTING (same data re-sent)
```

### Backend Lambda Flow

```
REQUEST_RECEIVED
  │  validate payload (fullName, phoneNumber E.164, tcpaConsent=true)
  ▼
VALIDATED
  │  call ElevenLabs POST /v1/convai/twilio/outbound-call
  ▼
CALL_INITIATED (return conversation_id + callSid to frontend)
  │
  └─ on ElevenLabs error → return structured error response
```

---

## Validation Rules

| Rule | Scope | Detail |
|------|-------|--------|
| `fullName` non-empty | Frontend + Backend | Cannot be blank or whitespace-only |
| `phoneNumber` E.164 | Frontend (libphonenumber-js) + Backend (regex) | Must match `/^\+[1-9]\d{6,14}$/` |
| `tcpaConsent === true` | Frontend + Backend | Backend rejects if `false` or missing |
| Country selector default | Frontend only | Defaults to `US` / `+1` on mount |

---

## API Payload Shapes

### `POST /api/v1/call-request` — Request Body

```typescript
interface CallRequestPayload {
  fullName: string;       // "Jane Smith"
  phoneNumber: string;    // "+15551234567" (E.164)
  tcpaConsent: boolean;   // true
  submittedAt: string;    // "2026-06-10T14:30:00.000Z"
}
```

### `POST /api/v1/call-request` — Success Response (`200`)

```typescript
interface CallRequestSuccess {
  conversationId: string;  // "conv_abc123"
  callSid: string;         // "CA1234567890abcdef"
  message: string;         // "Call initiated"
}
```

### `POST /api/v1/call-request` — Error Response (`4xx` / `5xx`)

```typescript
interface CallRequestError {
  error: string;    // Human-readable error message
  code: string;     // e.g., "ELEVENLABS_ERROR", "VALIDATION_ERROR", "TIMEOUT"
}
```
