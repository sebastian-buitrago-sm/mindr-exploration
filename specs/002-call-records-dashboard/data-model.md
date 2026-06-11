# Data Model: Call Records Dashboard

**Date**: 2026-06-10

---

## Domain Entity: `RemovalRequestRecord`

Represents a completed removal request call that was fully collected by the voice agent.

```typescript
interface RemovalRequestRecord {
  callId: string;       // ElevenLabs conversation_id — unique identifier, used as DynamoDB PK
  submittedAt: string;  // ISO 8601 timestamp of when the webhook was received
  userName: string;     // Full name spoken by the user during the call
  contactInfo: string;  // Phone number or email as provided by the user
  slot1: string;        // First available date/time, plain text (e.g. "Tuesday June 17 at 2pm")
  slot2: string;        // Second available date/time, plain text
}
```

**Validation rules**:
- All six fields are required and must be non-empty strings.
- If any field is missing from the webhook payload, the record is NOT persisted.
- `callId` must be unique — duplicate submissions with the same `callId` upsert (overwrite) the existing record.

---

## DynamoDB Table: `intoxalock-removal-requests`

| Attribute     | DynamoDB Type | Role           |
|---------------|---------------|----------------|
| `callId`      | S (String)    | Partition Key  |
| `submittedAt` | S (String)    | Sort Key       |
| `userName`    | S (String)    | —              |
| `contactInfo` | S (String)    | —              |
| `slot1`       | S (String)    | —              |
| `slot2`       | S (String)    | —              |

**Billing mode**: PAY_PER_REQUEST (on-demand) — appropriate for POC with unpredictable/low volume.

**Idempotency**: PutItem with no condition expression. A second webhook with the same `callId` overwrites the item — no duplicates, no error.

---

## Webhook Input Shape (from ElevenLabs)

Mapped from `data.data_collection_results` in the ElevenLabs post-call webhook payload:

| Webhook variable | Maps to entity field |
|---|---|
| `data.conversation_id` | `callId` |
| *(webhook receipt time)* | `submittedAt` |
| `data.data_collection_results.user_name.value` | `userName` |
| `data.data_collection_results.contact_info.value` | `contactInfo` |
| `data.data_collection_results.slot_1.value` | `slot1` |
| `data.data_collection_results.slot_2.value` | `slot2` |

---

## API Response Shape (GET /api/v1/removal-requests)

```typescript
interface GetRemovalRequestsResponse {
  records: RemovalRequestRecord[];  // sorted descending by submittedAt
}
```
