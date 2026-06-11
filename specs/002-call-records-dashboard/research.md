# Research: Call Records Dashboard

**Date**: 2026-06-10
**Feature**: 002-call-records-dashboard

---

## 1. ElevenLabs Post-Call Webhook Format

**Decision**: Parse `data_collection_results` from the ElevenLabs post-call webhook JSON payload.

**Rationale**: ElevenLabs fires a POST to a configured webhook URL after every conversation ends. The payload wraps the conversation result under a `data` field. Structured data collected by the agent during the call is available under `data.data_collection_results`, where each key is a variable name configured in the agent, and the value is `{ value: string, rationale: string }`.

**Expected payload shape**:
```json
{
  "type": "post_call_transcription",
  "event_timestamp": 1749600000,
  "data": {
    "conversation_id": "conv_abc123",
    "agent_id": "agent_xyz",
    "status": "done",
    "data_collection_results": {
      "user_name":    { "value": "Jane Smith",              "rationale": "User stated their name." },
      "contact_info": { "value": "+15551234567",            "rationale": "User provided a phone number." },
      "slot_1":       { "value": "Tuesday June 17 at 2pm",  "rationale": "First available slot stated." },
      "slot_2":       { "value": "Wednesday June 18 at 10am","rationale": "Second slot stated." }
    },
    "metadata": {
      "start_time_unix_secs": 1749600000,
      "call_duration_secs": 120
    }
  }
}
```

**Required fields** (all four must be present and non-empty for a record to be stored):
- `user_name`
- `contact_info`
- `slot_1`
- `slot_2`

**Incomplete call detection**: If any of the four variables is absent or its `value` is empty/null, the webhook is silently discarded (HTTP 200, no record written) per the clarified spec.

**Agent prompt update required**: The current ElevenLabs agent prompt does not ask for the user's name. The agent must be updated to include a step that collects the user's full name and maps it to the `user_name` Data Collection variable before this feature can be end-to-end tested.

**Alternatives considered**: Transcript parsing (regex/LLM extraction) — rejected because it's fragile and adds complexity. Structured Data Collection variables are the idiomatic ElevenLabs approach.

---

## 2. DynamoDB Table Design

**Decision**: Single table `intoxalock-removal-requests` with `callId` (string) as the partition key and `submittedAt` (ISO 8601 string) as the sort key. A GSI is not needed for this POC since all records are fetched in a single scan.

**Rationale**: The access patterns are:
1. Write one record per call (keyed by `callId` for idempotency).
2. Read all records sorted by `submittedAt` descending (done client-side after a full scan — acceptable for POC volume).

A composite primary key (`callId` PK + `submittedAt` SK) ensures natural idempotency: a duplicate webhook with the same `callId` will overwrite (upsert) rather than duplicate, satisfying FR-005.

**Table schema**:
| Attribute     | Type   | Role |
|---------------|--------|------|
| `callId`      | String | Partition Key |
| `submittedAt` | String | Sort Key (ISO 8601) |
| `userName`    | String | — |
| `contactInfo` | String | — |
| `slot1`       | String | — |
| `slot2`       | String | — |

**Alternatives considered**: Using `callId` alone as PK with a timestamp as SK makes range queries possible in future, but for this POC a Scan + client-side sort is sufficient and simpler.

---

## 3. Lambda Routing Strategy

**Decision**: Two new, separate Lambda handler files — each gets its own Terraform `aws_lambda_function` resource and its own API Gateway route.

**Rationale**: The existing `callRequestHandler.ts` handles `POST /api/v1/call-request`. Adding a router inside it would violate single-responsibility and make handler tests harder to isolate. Two new handlers (`webhookHandler.ts` and `removalRequestsHandler.ts`) keep each endpoint independently testable and deployable.

**New Lambda functions**:
| Handler file | Lambda function name | Route |
|---|---|---|
| `webhookHandler.ts` | `intoxalock-call-webhook` | `POST /api/v1/webhook/call-completed` |
| `removalRequestsHandler.ts` | `intoxalock-removal-requests` | `GET /api/v1/removal-requests` |

**Alternatives considered**: Single Lambda with internal routing (express-style) — rejected as premature abstraction for a 2-endpoint POC.

---

## 4. Frontend Routing

**Decision**: Add `react-router-dom` v6 to the frontend. Two routes: `/` (existing `HomePage`) and `/requests` (new `RequestsDashboardPage`).

**Rationale**: The current frontend has no router — `App.tsx` renders `HomePage` directly. Adding React Router v6 is the minimal change needed to serve two pages from the same SPA without a page reload.

**Alternatives considered**: Separate Vite build / separate S3 path — rejected as unnecessary complexity for a POC with two pages.

---

## 5. CORS Update

**Decision**: Add `GET` to the allowed methods in the API Gateway CORS configuration.

**Rationale**: The existing CORS config allows only `POST, OPTIONS`. The new `GET /api/v1/removal-requests` endpoint must be included. The Terraform `aws_apigatewayv2_api.http_api` `cors_configuration` block needs `GET` added to `allow_methods`.
