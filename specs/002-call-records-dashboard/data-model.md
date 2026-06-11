# Data Model: Call Records Dashboard

**Date**: 2026-06-10 (revised)

---

## Domain Entity: `CallRecord`

Represents one triggered outbound call from Daisy to a shop, including the submitted customer slots and the call outcome.

```typescript
interface CallRecord {
  callId: string;                    // ElevenLabs conversation_id — unique identifier, DynamoDB PK
  submittedAt: string;               // ISO 8601 timestamp of when POST /api/v1/call-request was received
  shopPhone: string;                 // Shop phone number dialed by Daisy
  customerSlots: string;             // JSON-serialized string[] — the 1-4 time slots provided by staff
  status: 'confirmed' | 'needs_recontact' | 'failed' | 'in_progress';
  confirmedSlot?: string;            // The slot that was accepted (set when status = confirmed)
  shopSuggestedSlots?: string;       // JSON-serialized string[] — slots proposed by shop (status = needs_recontact)
}
```

**Status semantics**:
| Status | Meaning |
|--------|---------|
| `in_progress` | Call was initiated; webhook not yet received |
| `confirmed` | Shop accepted one of the customer slots; `confirmedSlot` is set |
| `needs_recontact` | Shop rejected all customer slots and proposed their own; `shopSuggestedSlots` is set |
| `failed` | Call ended without any usable outcome |

**Validation rules**:
- `callId`, `submittedAt`, `shopPhone`, `customerSlots`, and `status` are required non-empty strings.
- `customerSlots` must deserialize to an array of 1–4 non-empty strings.
- `confirmedSlot` is required when `status = confirmed`.
- `shopSuggestedSlots` is required when `status = needs_recontact`.
- Duplicate `callId` upserts (overwrites) the existing record.

---

## DynamoDB Table: `intoxalock-removal-requests`

| Attribute            | DynamoDB Type | Role              | Required |
|----------------------|---------------|-------------------|----------|
| `callId`             | S (String)    | Partition Key     | Always   |
| `submittedAt`        | S (String)    | Sort Key (ISO 8601) | Always |
| `shopPhone`          | S (String)    | —                 | Always   |
| `customerSlots`      | S (String)    | JSON array string | Always   |
| `status`             | S (String)    | confirmed / needs_recontact / failed / in_progress | Always |
| `confirmedSlot`      | S (String)    | —                 | Conditional (status=confirmed) |
| `shopSuggestedSlots` | S (String)    | JSON array string | Conditional (status=needs_recontact) |

**Billing mode**: PAY_PER_REQUEST (on-demand) — appropriate for POC with unpredictable/low volume.

**Idempotency**: `PutItem` with no condition expression. A second webhook with the same `callId` overwrites the item — no duplicates, no error.

**JSON array fields**: `customerSlots` and `shopSuggestedSlots` are stored as JSON-serialized strings (e.g., `'["October 10th 8am–11am","October 10th 12pm–3pm"]'`) to keep the DynamoDB schema flat and avoid the complexity of typed list attributes for this POC.

---

## Write Path: POST /api/v1/call-request

When the frontend submits a pending call, the backend writes an initial `in_progress` record:

```typescript
// Written at call initiation
{
  callId: "<ElevenLabs conversationId returned by API>",
  submittedAt: "<ISO 8601 now>",
  shopPhone: "<shopPhone from request>",
  customerSlots: JSON.stringify(customerSlots),   // e.g. '["Oct 10 8am-11am","Oct 10 12pm-3pm"]'
  status: "in_progress"
}
```

---

## Write Path: POST /api/v1/webhook/call-completed

When the webhook arrives, the backend upserts the record with the final outcome. Mapped from `data.data_collection_results`:

| Webhook variable | Entity field | Notes |
|---|---|---|
| `data.conversation_id` | `callId` | Used to look up / overwrite the in_progress record |
| *(webhook receipt time)* | `submittedAt` | Only set if no prior record exists (race condition safety) |
| `data.data_collection_results.confirmed_slot.value` | `confirmedSlot` | Non-empty → status=confirmed |
| `data.data_collection_results.shop_suggested_slot_1.value` | part of `shopSuggestedSlots` | — |
| `data.data_collection_results.shop_suggested_slot_2.value` | part of `shopSuggestedSlots` | — |

**Status determination logic**:
```
if confirmedSlot is non-empty        → status = "confirmed"
else if any shopSuggestedSlot is set → status = "needs_recontact"
else                                 → status = "failed"
```

---

## API Response Shape: GET /api/v1/removal-requests

```typescript
interface GetCallRecordsResponse {
  records: CallRecord[];   // sorted descending by submittedAt
}
```

The `customerSlots` and `shopSuggestedSlots` fields are returned as raw JSON strings; the frontend parses them with `JSON.parse()` before rendering.
