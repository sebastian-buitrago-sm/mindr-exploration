# API Contract: Call Records Dashboard

**Version**: v1
**Base URL**: `https://<api-gateway-id>.execute-api.<region>.amazonaws.com`
**Local**: `http://localhost:3001`

---

## POST /api/v1/call-request

Initiates an outbound ElevenLabs call from Daisy to the shop phone. The customer's available time slots are passed as ElevenLabs dynamic variables so Daisy can propose them during the conversation.

### Request (sent by frontend)

**Headers**
```
Content-Type: application/json
```

**Body**
```json
{
  "shopPhone": "+12065550100",
  "customerSlots": [
    "October 10th 2023 8am to 11am",
    "October 10th 2023 12pm to 3pm"
  ],
  "submittedAt": "2026-06-10T14:00:00.000Z"
}
```

**Field rules**:
- `shopPhone`: string, required, E.164 format preferred (e.g. `+12065550100`)
- `customerSlots`: string array, 1–4 items required, each item a plain-text date/time range, all must be future dates (validated frontend-side)
- `submittedAt`: ISO 8601 string, required — submission timestamp from the client

**ElevenLabs dynamic variables built by backend**:

The handler maps `customerSlots[0]` → `slot_1`, `[1]` → `slot_2`, etc. Only slots that are present are included. Example with 2 slots:
```json
{
  "slot_1": "October 10th 2023 8am to 11am",
  "slot_2": "October 10th 2023 12pm to 3pm"
}
```

### Responses

#### 200 OK — Call initiated
```json
{
  "conversationId": "conv_abc123",
  "callSid": "CA1234567890abcdef",
  "message": "Call initiated"
}
```
- `conversationId`: ElevenLabs conversation ID, stored as `callId` in DynamoDB
- `callSid`: Telephony call identifier (may be null if not provided by ElevenLabs)

#### 400 Bad Request — Validation failure (missing/invalid fields)
```json
{
  "error": "Invalid request",
  "code": "VALIDATION_ERROR",
  "details": "customerSlots must contain 1–4 items"
}
```

#### 502 Bad Gateway — ElevenLabs API returned an error
```json
{
  "error": "Failed to initiate call",
  "code": "UPSTREAM_ERROR"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal error",
  "code": "INTERNAL_ERROR"
}
```

---

## POST /api/v1/webhook/call-completed

Receives the ElevenLabs post-call webhook after Daisy's conversation with the shop ends. Extracts the outcome from `data_collection_results` and persists (upserts) the call record in DynamoDB.

### Request (sent by ElevenLabs)

**Headers**
```
Content-Type: application/json
```

**Body** (ElevenLabs post-call webhook payload)
```json
{
  "type": "post_call_transcription",
  "event_timestamp": 1749600000,
  "data": {
    "conversation_id": "conv_abc123",
    "agent_id": "agent_xyz",
    "status": "done",
    "data_collection_results": {
      "confirmed_slot": {
        "value": "October 10th 2023 12pm to 3pm",
        "rationale": "Shop agreed to the second proposed slot."
      },
      "shop_suggested_slot_1": {
        "value": "",
        "rationale": "Not applicable — a customer slot was confirmed."
      },
      "shop_suggested_slot_2": {
        "value": "",
        "rationale": "Not applicable."
      }
    }
  }
}
```

**Outcome determination**:
| `confirmed_slot.value` | `shop_suggested_slot_1.value` | Resulting `status` |
|---|---|---|
| Non-empty string | (any) | `confirmed` |
| Empty | Non-empty | `needs_recontact` |
| Empty | Empty | `failed` |

**When `status = needs_recontact`** (shop rejected all customer slots):
```json
{
  "data_collection_results": {
    "confirmed_slot":        { "value": "", "rationale": "..." },
    "shop_suggested_slot_1": { "value": "October 12th 2023 8am to 11am", "rationale": "..." },
    "shop_suggested_slot_2": { "value": "October 15th 2023 11am to 2pm", "rationale": "..." }
  }
}
```

### Responses

#### 200 OK — Record upserted (or call failed with no data — still persisted as `failed`)
```json
{ "message": "ok" }
```

#### 400 Bad Request — Malformed payload (not valid JSON or missing `data.conversation_id`)
```json
{ "error": "Invalid payload", "code": "VALIDATION_ERROR" }
```

#### 500 Internal Server Error
```json
{ "error": "Internal error", "code": "INTERNAL_ERROR" }
```

---

## GET /api/v1/removal-requests

Returns all stored call records, sorted by `submittedAt` descending (newest first).

### Request

No body or query parameters required.

**Headers**
```
Accept: application/json
```

### Responses

#### 200 OK
```json
{
  "records": [
    {
      "callId":              "conv_abc123",
      "submittedAt":         "2026-06-10T14:30:00.000Z",
      "shopPhone":           "+12065550100",
      "customerSlots":       "[\"October 10th 2023 8am to 11am\",\"October 10th 2023 12pm to 3pm\"]",
      "status":              "confirmed",
      "confirmedSlot":       "October 10th 2023 12pm to 3pm",
      "shopSuggestedSlots":  null
    },
    {
      "callId":              "conv_def456",
      "submittedAt":         "2026-06-09T10:00:00.000Z",
      "shopPhone":           "+12065550199",
      "customerSlots":       "[\"October 8th 2023 9am to 12pm\"]",
      "status":              "needs_recontact",
      "confirmedSlot":       null,
      "shopSuggestedSlots":  "[\"October 12th 2023 8am to 11am\",\"October 15th 2023 11am to 2pm\"]"
    },
    {
      "callId":              "conv_ghi789",
      "submittedAt":         "2026-06-08T09:00:00.000Z",
      "shopPhone":           "+12065550150",
      "customerSlots":       "[\"October 5th 2023 10am to 1pm\"]",
      "status":              "failed",
      "confirmedSlot":       null,
      "shopSuggestedSlots":  null
    }
  ]
}
```

Returns an empty `records` array when no records exist (not a 404).

**Note**: `customerSlots` and `shopSuggestedSlots` are JSON-serialized strings. The frontend must call `JSON.parse()` on them before rendering.

#### 500 Internal Server Error
```json
{ "error": "Failed to fetch records", "code": "INTERNAL_ERROR" }
```

---

## CORS

All endpoints are covered by the existing API Gateway CORS configuration, extended to include `GET`:
```
Access-Control-Allow-Origin: <frontend-origin>
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```
