# Tasks: Call Records Dashboard

**Input**: Design documents from `specs/002-call-records-dashboard/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Tests**: Included — constitution mandates TDD (Red → Green → Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: New packages, Terraform resources, and directory scaffolding needed before any story work.

- [X] T001 Install `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` in `src/backend/package.json`
- [X] T002 [P] Install `react-router-dom` v6 in `src/frontend/package.json`
- [X] T003 [P] Create Terraform DynamoDB table resource in `src/Infra/dynamodb.tf` (table `intoxalock-removal-requests`, PK `callId`, SK `submittedAt`, PAY_PER_REQUEST)
- [X] T004 [P] Add `DYNAMODB_TABLE_NAME` variable to `src/Infra/variables.tf`
- [X] T005 Update `src/Infra/lambda.tf` — add IAM inline policy granting the existing `lambda_exec` role `dynamodb:PutItem` and `dynamodb:Scan` on the new table
- [X] T006 Update `src/Infra/api_gateway.tf` CORS `allow_methods` to include `GET`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain entity, repository port, and DynamoDB adapter used by both US1 and US2.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Create domain entity `RemovalRequestRecord` in `src/backend/src/domain/entities/RemovalRequestRecord.ts` (fields: callId, submittedAt, userName, contactInfo, slot1, slot2 — all strings)
- [X] T008 [P] Create repository port `IRemovalRequestRepository` in `src/backend/src/domain/ports/IRemovalRequestRepository.ts` (methods: `save(record): Promise<void>`, `findAll(): Promise<RemovalRequestRecord[]>`)
- [X] T009 Write unit test for `RemovalRequestRecord` validation in `src/backend/tests/unit/entities/RemovalRequestRecord.test.ts` — test that all six fields are required strings (RED)
- [X] T010 Implement `DynamoRemovalRequestRepository` in `src/backend/src/infrastructure/dynamo/DynamoRemovalRequestRepository.ts` — implements `IRemovalRequestRepository`, uses `DynamoDBDocumentClient.send(PutCommand)` for save and `ScanCommand` for findAll (sorted by `submittedAt` desc in-memory)
- [X] T011 Write integration test for `DynamoRemovalRequestRepository` in `src/backend/tests/integration/dynamo/DynamoRemovalRequestRepository.test.ts` — tests save + findAll against a local DynamoDB or mocked client
- [X] T012 [P] Create frontend entity `RemovalRequestRecord` in `src/frontend/src/domain/entities/RemovalRequestRecord.ts` (matches GET response shape from `contracts/api.md`)

**Checkpoint**: Repository adapter + domain entity ready. US1 and US2 can now proceed.

---

## Phase 3: User Story 1 — ElevenLabs Sends Call Data (Priority: P1) 🎯 MVP

**Goal**: Receive ElevenLabs post-call webhook, extract structured variables, persist to DynamoDB. Incomplete calls silently discarded.

**Independent Test**: POST a valid webhook payload to `POST /api/v1/webhook/call-completed` — record appears in DynamoDB. POST with missing fields — no record created, HTTP 200 returned.

### Tests for User Story 1 ⚠️ Write FIRST — ensure RED before implementing

- [X] T013 [US1] Write unit test for `RecordCallWebhookUseCase` in `src/backend/tests/unit/useCases/RecordCallWebhookUseCase.test.ts` — test: (a) valid payload saves record, (b) missing any of the 4 variables discards silently, (c) duplicate callId calls save without error (RED)
- [X] T014 [P] [US1] Write unit test for `webhookHandler` in `src/backend/tests/unit/handlers/webhookHandler.test.ts` — test: (a) valid body → 200 `{"message":"ok"}`, (b) malformed JSON → 400, (c) missing fields → 200 no save, (d) all CORS headers present (RED)

### Implementation for User Story 1

- [X] T015 [US1] Implement `RecordCallWebhookUseCase` in `src/backend/src/application/useCases/RecordCallWebhookUseCase.ts` — accepts raw webhook payload, extracts `data.conversation_id`, `data.data_collection_results.{user_name,contact_info,slot_1,slot_2}.value`, discards if any is empty, calls `repository.save()` (GREEN for T013)
- [X] T016 [US1] Implement `webhookHandler` in `src/backend/src/presentation/handlers/webhookHandler.ts` — thin Lambda handler: parse JSON body, delegate to `RecordCallWebhookUseCase`, return appropriate HTTP response with CORS headers (GREEN for T014)
- [X] T017 [US1] Add two new Terraform Lambda resources and API Gateway routes to `src/Infra/lambda.tf` and `src/Infra/api_gateway.tf` — `intoxalock-call-webhook` function handling `POST /api/v1/webhook/call-completed` and `intoxalock-removal-requests` function handling `GET /api/v1/removal-requests`

**Checkpoint**: Webhook endpoint live. Validated with `curl` per `quickstart.md` section 2.

---

## Phase 4: User Story 2 — Operations Staff Views All Removal Requests (Priority: P2)

**Goal**: GET endpoint returns all records sorted newest-first. Frontend dashboard at `/requests` shows them in a MUI table.

**Independent Test**: Seed 2+ records with different timestamps. `GET /api/v1/removal-requests` returns them newest-first. Navigate to `/requests` — table shows all rows with correct columns. Navigate to `/requests` with empty DB — empty-state message shown.

### Tests for User Story 2 ⚠️ Write FIRST — ensure RED before implementing

- [X] T018 [US2] Write unit test for `GetRemovalRequestsUseCase` in `src/backend/tests/unit/useCases/GetRemovalRequestsUseCase.test.ts` — test: (a) calls `repository.findAll()`, (b) returns records sorted descending by `submittedAt` (RED)
- [X] T019 [P] [US2] Write unit test for `removalRequestsHandler` in `src/backend/tests/unit/handlers/removalRequestsHandler.test.ts` — test: (a) returns `{"records":[...]}` with HTTP 200, (b) returns `{"records":[]}` when empty, (c) CORS headers present (RED)
- [X] T020 [P] [US2] Write unit test for `RequestsTable` component in `src/frontend/tests/unit/components/RequestsTable.test.tsx` — test: (a) renders all rows, (b) renders correct column headers, (c) renders empty-state when records=[] (RED)
- [X] T021 [P] [US2] Write unit test for `RequestsDashboardPage` in `src/frontend/tests/unit/pages/RequestsDashboardPage.test.tsx` — test: (a) shows loading state while fetching, (b) renders table when records load, (c) shows error message on API failure (RED)

### Implementation for User Story 2

- [X] T022 [US2] Implement `GetRemovalRequestsUseCase` in `src/backend/src/application/useCases/GetRemovalRequestsUseCase.ts` — calls `repository.findAll()`, returns records (GREEN for T018)
- [X] T023 [US2] Implement `removalRequestsHandler` in `src/backend/src/presentation/handlers/removalRequestsHandler.ts` — thin Lambda handler: delegate to `GetRemovalRequestsUseCase`, return `{"records":[...]}` with CORS headers (GREEN for T019)
- [X] T024 [P] [US2] Implement `removalRequestsClient` in `src/frontend/src/infrastructure/api/removalRequestsClient.ts` — fetch `GET /api/v1/removal-requests`, return typed `RemovalRequestRecord[]`
- [X] T025 [P] [US2] Implement `getRemovalRequests` use case in `src/frontend/src/application/useCases/getRemovalRequests.ts` — calls `removalRequestsClient`, returns records array
- [X] T026 [US2] Implement `RequestsTable` component in `src/frontend/src/presentation/components/RequestsTable/RequestsTable.tsx` — MUI `Table` with columns: Name, Contact Info, First Available Slot, Second Available Slot, Request Date/Time; renders empty-state MUI `Typography` when `records` is empty (GREEN for T020)
- [X] T027 [US2] Implement `RequestsDashboardPage` in `src/frontend/src/presentation/pages/RequestsDashboardPage.tsx` — fetches records via `getRemovalRequests` use case on mount, renders `RequestsTable`, shows MUI `CircularProgress` while loading, shows MUI `Alert` on error; uses Intoxalock theme colors (GREEN for T021)
- [X] T028 [US2] Update `src/frontend/src/App.tsx` — wrap with `BrowserRouter`, add routes: `/` → `HomePage`, `/requests` → `RequestsDashboardPage`

**Checkpoint**: Dashboard page live at `/requests`. Validated per `quickstart.md` section 4.

---

## Phase 5: User Story 3 — Records Sorted Most Recent First (Priority: P3)

**Goal**: Confirm sort order is newest-first in both GET endpoint and dashboard display. (Mostly covered by US1/US2 implementation — this phase adds explicit sort validation.)

**Independent Test**: Insert 3 records with different `submittedAt` values. `GET /api/v1/removal-requests` returns them newest-first. Dashboard table displays them in the same order.

### Tests for User Story 3 ⚠️ Write FIRST — ensure RED before implementing

- [X] T029 [US3] Write integration test for sort order in `src/backend/tests/integration/handlers/removalRequestsHandler.test.ts` — seed 3 records with distinct timestamps, call GET handler, assert response `records[0].submittedAt` is the latest (RED)

### Implementation for User Story 3

- [X] T030 [US3] Verify `DynamoRemovalRequestRepository.findAll()` sorts results by `submittedAt` descending in-memory after Scan — add sort if not already present (GREEN for T029)

**Checkpoint**: All three user stories independently functional and verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T031 [P] Ensure `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_AGENT_PHONE_NUMBER_ID`, and `DYNAMODB_TABLE_NAME` are wired as Lambda environment variables in `src/Infra/lambda.tf` for both new functions
- [X] T032 [P] Run `tsc --noEmit` in `src/backend` — fix any type errors
- [X] T033 [P] Run `tsc --noEmit` in `src/frontend` — fix any type errors
- [X] T034 [P] Run `eslint` in `src/backend` — fix lint errors
- [X] T035 [P] Run `eslint` in `src/frontend` — fix lint errors
- [X] T036 Run full test suite in `src/backend` (`npm test`) — all tests must pass
- [X] T037 [P] Run full test suite in `src/frontend` (`npm test`) — all tests must pass
- [X] T038 Add note to `src/Infra/README.md` (or inline `variables.tf` description) documenting the `DYNAMODB_TABLE_NAME` variable and the manual ElevenLabs agent prompt update required before end-to-end testing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Requires Phase 1 — blocks all user stories
- **Phase 3 (US1)**: Requires Phase 2
- **Phase 4 (US2)**: Requires Phase 2; integrates with US1's infrastructure (Lambda + API Gateway) but is independently testable
- **Phase 5 (US3)**: Requires Phase 4 (sort is part of the repository adapter from Phase 2)
- **Phase 6 (Polish)**: Requires all story phases

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no story dependencies
- **US2 (P2)**: Can start after Phase 2 — no story dependencies (depends on same Terraform resources as US1 but different handler files)
- **US3 (P3)**: Validation of sort behaviour introduced in US1/US2 — can start after Phase 2 is complete

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Domain entities before use cases
- Use cases before handlers
- Backend handler before Terraform route (route needs the Lambda ARN)
- Frontend: client → use case → component → page → router update

### Parallel Opportunities

| Group | Tasks |
|---|---|
| Phase 1 parallel | T002, T003, T004 can run alongside T001 |
| Phase 2 parallel | T008, T009, T012 can run alongside T007 |
| US1 tests | T013, T014 can run in parallel |
| US2 tests | T018, T019, T020, T021 can all run in parallel |
| US2 frontend impl | T024, T025 can run in parallel after T023 |
| Polish | T031–T037 all parallelizable |

---

## Parallel Example: User Story 2

```bash
# Launch all US2 tests in parallel (write FIRST, confirm RED):
Task T018: GetRemovalRequestsUseCase unit test
Task T019: removalRequestsHandler unit test
Task T020: RequestsTable component unit test
Task T021: RequestsDashboardPage unit test

# Then implement in parallel where possible:
Task T024: removalRequestsClient (frontend infra)
Task T025: getRemovalRequests use case (frontend app)
# (T022, T023 backend — can run in parallel with frontend tasks above)
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1
4. **STOP AND VALIDATE**: POST webhook with curl per `quickstart.md` section 2
5. Record visible in DynamoDB — MVP demo ready

### Incremental Delivery

1. Setup + Foundational → shared infrastructure ready
2. US1 → webhook ingestion live → validate → demo
3. US2 → dashboard live → validate → demo
4. US3 → sort order confirmed → polish → ship

---

## Notes

- [P] tasks = different files, no inter-task dependencies
- [Story] label maps each task to its user story for traceability
- **ElevenLabs agent prompt**: Must be manually updated (outside code scope) to add a `user_name` Data Collection variable before end-to-end testing
- Verify tests fail (RED) before writing implementation (GREEN)
- Commit after each phase checkpoint
