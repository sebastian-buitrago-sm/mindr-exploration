# Research: Call Records Dashboard

**Date**: 2026-06-10 (revised)
**Feature**: 002-call-records-dashboard

---

## 1. ElevenLabs Dynamic Variables — Passing Customer Slots at Call Initiation

**Decision**: Pass customer time slots to the ElevenLabs agent as `dynamic_variables` in the call-initiation request body.

**Rationale**: ElevenLabs Conversational AI supports dynamic variables that are injected into the agent's system prompt at the start of a conversation. This allows the backend to pass per-call data (the customer's proposed time slots) without modifying the agent configuration for each call. The agent's prompt references them as `{{slot_1}}`, `{{slot_2}}`, etc.

**How it works**:
When calling the ElevenLabs API to start an outbound conversation (`POST /v1/convai/conversations` or equivalent SDK method), the backend includes:

```json
{
  "agent_id": "<ELEVENLABS_AGENT_ID>",
  "customer_number": "+12065550100",
  "dynamic_variables": {
    "slot_1": "October 10th 2023 8am to 11am",
    "slot_2": "October 10th 2023 12pm to 3pm"
  }
}
```

Only the slots that were provided are included. If the user supplies 3 slots, `slot_1`, `slot_2`, and `slot_3` are passed; `slot_4` is omitted. The agent's prompt handles missing slots with conditional language (e.g., only tries the slots it has).

**Agent system prompt usage**:
```
The customer has proposed the following time slots:
- Slot 1: {{slot_1}}
{{#if slot_2}}- Slot 2: {{slot_2}}{{/if}}
{{#if slot_3}}- Slot 3: {{slot_3}}{{/if}}
{{#if slot_4}}- Slot 4: {{slot_4}}{{/if}}
```

**Alternatives considered**: Hardcoding slots in a tool definition or passing them as a single concatenated string — rejected because separate variables give the agent clearer, more controllable handling of each slot in the negotiation flow.

---

## 2. ElevenLabs Post-Call Webhook — Outcome Variables

**Decision**: Extract `confirmed_slot`, `shop_suggested_slot_1`, and `shop_suggested_slot_2` from `data_collection_results` to determine the call outcome.

**Rationale**: ElevenLabs Data Collection lets the agent be configured with named variables that it populates during the call. For this feature, Daisy collects:

- `confirmed_slot`: The time slot (customer-proposed or shop-proposed) that both parties agreed to. Non-empty when an agreement is reached.
- `shop_suggested_slot_1`: The first slot the shop proposed when all customer slots were rejected.
- `shop_suggested_slot_2`: The second slot the shop proposed (optional — shop may only provide one).

**Expected webhook payload when shop confirms a customer slot**:
```json
{
  "type": "post_call_transcription",
  "event_timestamp": 1749600000,
  "data": {
    "conversation_id": "conv_abc123",
    "agent_id": "agent_xyz",
    "status": "done",
    "data_collection_results": {
      "confirmed_slot":        { "value": "October 10th 2023 12pm to 3pm", "rationale": "Shop agreed." },
      "shop_suggested_slot_1": { "value": "", "rationale": "Not applicable." },
      "shop_suggested_slot_2": { "value": "", "rationale": "Not applicable." }
    }
  }
}
```

**Expected webhook payload when shop proposes their own slots**:
```json
{
  "data_collection_results": {
    "confirmed_slot":        { "value": "", "rationale": "No customer slot was accepted." },
    "shop_suggested_slot_1": { "value": "October 12th 2023 8am to 11am", "rationale": "Shop stated." },
    "shop_suggested_slot_2": { "value": "October 15th 2023 11am to 2pm", "rationale": "Shop provided second option." }
  }
}
```

**Status determination** (implemented in `RecordCallWebhookUseCase`):
```
confirmed_slot non-empty  → status = "confirmed"
shop_suggested_slot_1 non-empty → status = "needs_recontact"
otherwise                 → status = "failed"
```

**Incomplete call detection**: If `data.conversation_id` is missing, return HTTP 400. If the `data_collection_results` key is missing entirely, treat as `failed` and still persist a record.

**Alternatives considered**: Transcript parsing — rejected as fragile. Structured Data Collection variables are the idiomatic ElevenLabs approach and provide reliable, well-typed results.

---

## 3. DynamoDB Table Design

**Decision**: Single table `intoxalock-removal-requests` with `callId` (string) as the partition key and `submittedAt` (ISO 8601 string) as the sort key. Revised schema adds `shopPhone`, `customerSlots`, `status`, `confirmedSlot`, `shopSuggestedSlots`.

**Rationale**: The access patterns are:
1. Write one record at call initiation keyed by `callId` (status = `in_progress`).
2. Upsert the same record when the webhook arrives (status updated to final value).
3. Read all records sorted by `submittedAt` descending (full scan + in-memory sort — acceptable for POC volume).

A composite primary key (`callId` PK + `submittedAt` SK) ensures idempotency: a duplicate webhook overwrites rather than duplicates.

**JSON serialization for array fields**: `customerSlots` and `shopSuggestedSlots` are stored as JSON strings rather than DynamoDB L (List) attributes. This simplifies the Zod schema and avoids DynamoDB's typed list marshalling for a POC.

**Status lifecycle**:
```
[submitted] → in_progress → confirmed | needs_recontact | failed
```

**Alternatives considered**: Using separate DynamoDB attributes for each slot (slot1, slot2, slot3, slot4) — rejected because the number of slots is variable and JSON serialization is simpler and more flexible.

---

## 4. Lambda Routing Strategy

**Decision**: Three separate Lambda handler files — each gets its own Terraform `aws_lambda_function` resource and API Gateway route.

**Rationale**: Each endpoint has a distinct responsibility. The existing `callRequestHandler.ts` is updated (not replaced) to accept the new `shopPhone` + `customerSlots[]` shape and pass dynamic variables to ElevenLabs. Two new handlers (`webhookHandler.ts` and `removalRequestsHandler.ts`) keep each endpoint independently testable and deployable.

**Lambda functions**:
| Handler file | Lambda function name | Route |
|---|---|---|
| `callRequestHandler.ts` | `intoxalock-call-request` (existing, updated) | `POST /api/v1/call-request` |
| `webhookHandler.ts` | `intoxalock-call-webhook` (new) | `POST /api/v1/webhook/call-completed` |
| `removalRequestsHandler.ts` | `intoxalock-removal-requests` (new) | `GET /api/v1/removal-requests` |

---

## 5. Frontend Form Design

**Decision**: Add a "Simulate pending call" form to the existing `HomePage` (or a dedicated sub-section). Use `@mui/x-date-pickers` for date/time slot inputs.

**Slot defaults**:
- Slot 1: tomorrow at 10:00 AM (local time)
- Slot 2: day after tomorrow at 2:00 PM (local time)

**Validation rules** (enforced before submission):
- `shopPhone`: non-empty string
- Each slot date/time must be strictly in the future (after `Date.now()`)
- At least 1 slot required; maximum 4 slots
- The "Add slot" button is hidden/disabled when 4 slots are already present

**Form submission flow**:
1. Staff fills form and clicks "Initiate Call"
2. Frontend builds `customerSlots` array from slot picker values (formatted as plain-text strings, e.g., "October 10th 2023 8am to 11am")
3. POST to `/api/v1/call-request`
4. On success: show success chip with `conversationId`
5. On error: show MUI `Alert` with the error message

**Alternatives considered**: Separate page for the form — rejected because it adds navigation complexity for a simple POC; embedding in `HomePage` keeps the flow linear.

---

## 6. CORS Update

**Decision**: Add `GET` to the allowed methods in the API Gateway CORS configuration.

**Rationale**: The existing CORS config allows only `POST, OPTIONS`. The new `GET /api/v1/removal-requests` endpoint must be included. The Terraform `aws_apigatewayv2_api.http_api` `cors_configuration` block needs `GET` added to `allow_methods`.

---

## 7. Frontend Routing

**Decision**: Add `react-router-dom` v6 to the frontend. Two routes: `/` (existing `HomePage` with embedded `PendingCallForm`) and `/requests` (new `RequestsDashboardPage`).

**Rationale**: The current frontend has no router. Adding React Router v6 is the minimal change needed to serve two pages from the same SPA.
