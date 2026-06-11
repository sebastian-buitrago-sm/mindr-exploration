# API Contract: Call Records Dashboard

**Version**: v1
**Base URL**: `https://<api-gateway-id>.execute-api.<region>.amazonaws.com`
**Local**: `http://localhost:3001`

---

## POST /api/v1/webhook/call-completed

Receives the ElevenLabs post-call webhook after a voice agent conversation ends. Persists the collected data as a removal request record if all required fields are present. Silently discards incomplete calls.

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
      "user_name":    { "value": "Jane Smith",               "rationale": "..." },
      "contact_info": { "value": "+15551234567",             "rationale": "..." },
      "slot_1":       { "value": "Tuesday June 17 at 2pm",   "rationale": "..." },
      "slot_2":       { "value": "Wednesday June 18 at 10am","rationale": "..." }
    }
  }
}
```

### Responses

#### 200 OK — Record saved (or incomplete call discarded)
```json
{ "message": "ok" }
```
Returned for both successfully persisted records AND silently discarded incomplete calls.

#### 400 Bad Request — Malformed payload (not valid JSON or missing envelope)
```json
{ "error": "Invalid payload", "code": "VALIDATION_ERROR" }
```

#### 500 Internal Server Error — Unexpected persistence failure
```json
{ "error": "Internal error", "code": "INTERNAL_ERROR" }
```

---

## GET /api/v1/removal-requests

Returns all stored removal request records, sorted by submission timestamp descending (newest first).

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
      "callId":      "conv_abc123",
      "submittedAt": "2026-06-10T14:30:00.000Z",
      "userName":    "Jane Smith",
      "contactInfo": "+15551234567",
      "slot1":       "Tuesday June 17 at 2pm",
      "slot2":       "Wednesday June 18 at 10am"
    }
  ]
}
```
Returns an empty `records` array when no records exist (not a 404).

#### 500 Internal Server Error
```json
{ "error": "Failed to fetch records", "code": "INTERNAL_ERROR" }
```

---

## CORS

Both new endpoints are added to the existing API Gateway CORS configuration:
```
Access-Control-Allow-Origin: <frontend-origin>
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```
