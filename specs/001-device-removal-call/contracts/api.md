# API Contract: Call Request Endpoint

**Version**: v1
**Base URL**: `https://<api-gateway-id>.execute-api.<region>.amazonaws.com/prod`
**Local (SAM)**: `http://localhost:3001`

---

## POST /api/v1/call-request

Initiates an outbound AI phone call to the customer via ElevenLabs + Twilio.

### Request

**Headers**
```
Content-Type: application/json
```

**Body**
```json
{
  "fullName": "Jane Smith",
  "phoneNumber": "+15551234567",
  "tcpaConsent": true,
  "submittedAt": "2026-06-10T14:30:00.000Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | ✅ | Customer's full name (non-empty, max 100 chars) |
| `phoneNumber` | string | ✅ | E.164 formatted phone number (e.g., `+15551234567`) |
| `tcpaConsent` | boolean | ✅ | Must be `true`; request rejected if `false` |
| `submittedAt` | string | ✅ | ISO 8601 timestamp of form submission |

---

### Responses

#### 200 OK — Call successfully initiated

```json
{
  "conversationId": "conv_abc123",
  "callSid": "CA1234567890abcdef",
  "message": "Call initiated"
}
```

#### 400 Bad Request — Validation error

```json
{
  "error": "Phone number must be in E.164 format.",
  "code": "VALIDATION_ERROR"
}
```

Triggered by: missing required field, invalid `phoneNumber` format, `tcpaConsent` not `true`.

#### 502 Bad Gateway — ElevenLabs API error

```json
{
  "error": "Failed to initiate call. Please try again.",
  "code": "ELEVENLABS_ERROR"
}
```

Triggered by: ElevenLabs 4xx/5xx response.

#### 504 Gateway Timeout — Lambda timeout

```json
{
  "error": "Request timed out. Please try again.",
  "code": "TIMEOUT"
}
```

---

### CORS

The API Gateway MUST respond to `OPTIONS` preflight requests and include:

```
Access-Control-Allow-Origin: <frontend-origin>
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## ElevenLabs Outbound Call (Internal — Backend Only)

The Lambda calls this endpoint internally. Not exposed to the frontend.

**Endpoint**: `POST https://api.elevenlabs.io/v1/convai/twilio/outbound-call`

**Headers**
```
xi-api-key: <ELEVENLABS_API_KEY>
Content-Type: application/json
```

**Body**
```json
{
  "agent_id": "<ELEVENLABS_AGENT_ID>",
  "agent_phone_number_id": "<ELEVENLABS_AGENT_PHONE_NUMBER_ID>",
  "to_number": "+15551234567"
}
```

**Success Response**
```json
{
  "success": true,
  "message": "Call initiated",
  "conversation_id": "conv_abc123",
  "callSid": "CA1234567890abcdef"
}
```
