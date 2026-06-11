# Implementation Plan: Call Records Dashboard

**Branch**: `002-call-records-dashboard` | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)

## Summary

Extend the existing Intoxalock POC with a revised call flow: Daisy (ElevenLabs AI agent) calls the **shop** on behalf of Intoxalock, proposing customer time slots. Three new Lambda endpoints are added: `POST /api/v1/call-request` (initiates outbound call with dynamic variables), `POST /api/v1/webhook/call-completed` (receives post-call result and persists to DynamoDB), and `GET /api/v1/removal-requests` (returns all records). The frontend gains a "Simulate pending call" form and a `/requests` dashboard showing outcomes with status badges.

---

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend) — same as feature 001

**Primary Dependencies**:
- Backend: Node.js 18 (Lambda `nodejs18.x`), `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, Zod
- Frontend: React 18, Vite 5, MUI v6, `react-router-dom` v6, `@mui/x-date-pickers` (date/time picker for slot inputs)

**Storage**: DynamoDB — table `intoxalock-removal-requests` (revised schema — see `data-model.md`)

**Testing**:
- Backend: Jest + `ts-jest`
- Frontend: Vitest + React Testing Library

**Target Platform**: AWS (Lambda + API Gateway v2 + DynamoDB + S3 + CloudFront)

**Project Type**: Extension of existing web application — updated + new Lambda handlers, updated + new frontend components/pages

**Performance Goals**:
- Call initiation within 5 seconds of form submit (SC-001)
- Webhook persistence within 3 seconds (SC-002)
- Dashboard load within 3 seconds (SC-003)

**Constraints**:
- No authentication (POC)
- No pagination — full scan for POC volume
- No auto-refresh — manual page reload only
- Secrets via Lambda environment variables (`ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_AGENT_PHONE_NUMBER_ID`, `DYNAMODB_TABLE_NAME`)
- All copy in English
- No PII in logs

**Scale/Scope**: POC — low call volume, single region, no rate limiting

---

## Key Architectural Change vs. Previous Design

The original spec assumed Daisy collected data **from the customer** via inbound call. The revised flow is:

1. Operations staff fills out a frontend form → `POST /api/v1/call-request` (shopPhone + customerSlots array)
2. `callRequestHandler.ts` passes slots as ElevenLabs `dynamic_variables` (`slot_1`…`slot_4`) and initiates an **outbound call to the shop**
3. Daisy negotiates with the shop using the customer's proposed slots
4. ElevenLabs fires a post-call webhook → `POST /api/v1/webhook/call-completed`
5. `webhookHandler.ts` extracts outcome and writes to DynamoDB
6. Staff views all records at `GET /api/v1/removal-requests` / frontend `/requests`

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Clean Architecture | PASS | Handlers are thin; logic delegated to use cases; DynamoDB access behind repository port |
| II. Spec-Driven | PASS | spec.md revised before any code changes |
| III. Test-First | PASS | Unit + integration tests defined in tasks before implementation tasks |
| IV. API-First | PASS | All three endpoints contracted in `contracts/api.md` before handler code |
| V. Security & Compliance | PASS | No PII logged; AWS credentials via env vars; unauthenticated endpoints are POC-scoped and documented |
| VI. Simplicity | PASS | Full scan (no GSI), no router abstraction, no shared layers — POC scope respected |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-call-records-dashboard/
├── plan.md              <- this file
├── spec.md
├── research.md
├── data-model.md
├── agent-prompt.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (additions and updates)

```text
src/backend/src/
├── domain/
│   ├── entities/
│   │   └── CallRecord.ts                        <- new domain entity (replaces RemovalRequestRecord)
│   └── ports/
│       └── ICallRecordRepository.ts             <- new repository port
├── application/
│   └── useCases/
│       ├── InitiateCallUseCase.ts               <- new: validate slots, call ElevenLabs API
│       ├── RecordCallWebhookUseCase.ts          <- new: parse webhook, determine status, persist
│       └── GetCallRecordsUseCase.ts             <- new: return all records sorted desc
├── infrastructure/
│   └── dynamo/
│       └── DynamoCallRecordRepository.ts        <- new DynamoDB adapter
└── presentation/
    └── handlers/
        ├── callRequestHandler.ts                <- updated: accepts shopPhone + customerSlots[], passes dynamic_variables to ElevenLabs
        ├── webhookHandler.ts                    <- new Lambda handler (POST /api/v1/webhook/call-completed)
        └── removalRequestsHandler.ts            <- new Lambda handler (GET /api/v1/removal-requests)

src/backend/tests/
├── unit/
│   ├── useCases/
│   │   ├── InitiateCallUseCase.test.ts
│   │   ├── RecordCallWebhookUseCase.test.ts
│   │   └── GetCallRecordsUseCase.test.ts
│   └── handlers/
│       ├── callRequestHandler.test.ts           <- updated tests for new request shape
│       ├── webhookHandler.test.ts
│       └── removalRequestsHandler.test.ts
└── integration/
    └── dynamo/
        └── DynamoCallRecordRepository.test.ts

src/frontend/src/
├── domain/
│   └── entities/
│       └── CallRecord.ts                        <- new frontend entity
├── application/
│   └── useCases/
│       ├── initiateCall.ts                      <- new: submit form data to POST /api/v1/call-request
│       └── getCallRecords.ts                    <- new: fetch GET /api/v1/removal-requests
├── infrastructure/
│   └── api/
│       ├── callRequestClient.ts                 <- new: POST /api/v1/call-request
│       └── callRecordsClient.ts                 <- new: GET /api/v1/removal-requests
└── presentation/
    ├── components/
    │   ├── PendingCallForm/
    │   │   └── PendingCallForm.tsx              <- new: shopPhone + 1-4 slot pickers
    │   └── CallRecordsTable/
    │       └── CallRecordsTable.tsx             <- new: MUI table with status badges
    ├── pages/
    │   ├── HomePage.tsx                         <- updated: embed PendingCallForm
    │   └── RequestsDashboardPage.tsx            <- new: /requests dashboard page
    └── App.tsx                                  <- updated: add React Router + /requests route

src/frontend/tests/
├── unit/
│   ├── components/
│   │   ├── PendingCallForm.test.tsx
│   │   └── CallRecordsTable.test.tsx
│   ├── pages/
│   │   └── RequestsDashboardPage.test.tsx
│   └── useCases/
│       └── getCallRecords.test.ts

src/Infra/
├── dynamodb.tf          <- updated: revised table schema attributes
├── lambda.tf            <- updated: callRequestHandler env vars + 2 new Lambda functions + IAM DynamoDB policy
├── api_gateway.tf       <- updated: 2 new routes + CORS GET
└── variables.tf         <- updated: DYNAMODB_TABLE_NAME var
```

---

## ElevenLabs Dynamic Variables — Call Initiation

When `POST /api/v1/call-request` is handled, the backend builds a `dynamic_variables` map:

```typescript
// example with 2 slots
{
  slot_1: "October 10th 2023 8am to 11am",
  slot_2: "October 10th 2023 12pm to 3pm"
}
```

Only slots that are provided are included. Slots 3 and 4 are omitted if not supplied. This map is passed in the ElevenLabs `POST /v1/convai/conversations` request body under the `dynamic_variables` field (or equivalent per ElevenLabs SDK).

---

## Complexity Tracking

No constitution violations requiring justification.

> **Manual setup required**: Before end-to-end testing, the ElevenLabs agent must be configured with:
> 1. A system prompt using `{{slot_1}}`–`{{slot_4}}` dynamic variable placeholders (see `agent-prompt.md`)
> 2. Data Collection variables: `confirmed_slot`, `shop_suggested_slot_1`, `shop_suggested_slot_2`
> 3. The outbound phone number configured in ElevenLabs (used via `ELEVENLABS_AGENT_PHONE_NUMBER_ID`)
