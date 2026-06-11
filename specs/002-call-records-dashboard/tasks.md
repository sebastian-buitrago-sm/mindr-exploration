# Tasks: Call Records Dashboard (Revised)

**Input**: Design documents from `specs/002-call-records-dashboard/`

**Prerequisites**: plan.md (revised) ✅ spec.md (revised) ✅ research.md (revised) ✅ data-model.md (revised) ✅ contracts/api.md (revised) ✅ agent-prompt.md ✅

**Tests**: Included — constitution mandates TDD (Red → Green → Refactor).

**Organization**: Tasks grouped by phase and user story. All existing tasks from previous spec version are superseded.

## Format: `[ID] [P?] [US?] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no shared dependencies)
- **[US?]**: User story this task belongs to (US1 / US2 / US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: New packages, Terraform resources, and directory scaffolding needed before any story work.

- [X] T001 Install `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` in `src/backend/package.json` (if not already present from feature 001)
- [X] T002 [P] Install `react-router-dom` v6 in `src/frontend/package.json`
- [X] T003 [P] Install `@mui/x-date-pickers` and `dayjs` in `src/frontend/package.json` (for slot date/time picker inputs)
- [X] T004 [P] Update Terraform DynamoDB table resource in `src/Infra/dynamodb.tf` — table `intoxalock-removal-requests`, PK `callId` (S), SK `submittedAt` (S), billing PAY_PER_REQUEST. Only declare `attribute {}` blocks for PK and SK — DynamoDB non-key attributes (`shopPhone`, `customerSlots`, etc.) do not need `attribute {}` blocks in Terraform and will be written freely at runtime.
- [X] T005 [P] Add `DYNAMODB_TABLE_NAME` variable to `src/Infra/variables.tf` with description and default `"intoxalock-removal-requests"`
- [X] T006 Update `src/Infra/lambda.tf` — add IAM inline policy granting the existing `lambda_exec` role `dynamodb:PutItem` and `dynamodb:Scan` on the `intoxalock-removal-requests` table ARN
- [X] T007 [P] Update `src/Infra/api_gateway.tf` CORS `allow_methods` to include `GET` alongside `POST` and `OPTIONS`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain entity, repository port, and DynamoDB adapter shared by US1, US2, and US3.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 Create domain entity `CallRecord` in `src/backend/src/domain/entities/CallRecord.ts`:
  ```typescript
  interface CallRecord {
    callId: string;
    submittedAt: string;
    shopPhone: string;
    customerSlots: string;          // JSON-serialized string[]
    status: 'confirmed' | 'needs_recontact' | 'failed' | 'in_progress';
    confirmedSlot?: string;
    shopSuggestedSlots?: string;    // JSON-serialized string[]
  }
  ```
- [X] T009 [P] Create repository port `ICallRecordRepository` in `src/backend/src/domain/ports/ICallRecordRepository.ts` with methods:
  - `save(record: CallRecord): Promise<void>`
  - `findAll(): Promise<CallRecord[]>`
- [X] T010 [P] Write unit test for `CallRecord` in `src/backend/tests/unit/entities/CallRecord.test.ts` — verify all required fields are non-empty strings and status is one of the four valid values (RED)
- [X] T011 Implement `DynamoCallRecordRepository` in `src/backend/src/infrastructure/dynamo/DynamoCallRecordRepository.ts`:
  - Implements `ICallRecordRepository`
  - `save()`: uses `DynamoDBDocumentClient.send(PutCommand)` — upserts by `callId`+`submittedAt`
  - `findAll()`: uses `ScanCommand`, sorts results by `submittedAt` descending in-memory before returning
  - Reads table name from `process.env.DYNAMODB_TABLE_NAME`
- [X] T012 Write integration test for `DynamoCallRecordRepository` in `src/backend/tests/integration/dynamo/DynamoCallRecordRepository.test.ts`:
  - Test `save()` with a full `CallRecord` — verify item exists in mocked/local DynamoDB
  - Test `findAll()` with 3 records at different timestamps — verify descending order
  - Test upsert: save same `callId` twice with different `status` — verify only one item, second status wins
- [X] T013 [P] Create frontend entity `CallRecord` in `src/frontend/src/domain/entities/CallRecord.ts` — matches GET response shape from `contracts/api.md`

**Checkpoint**: Repository adapter + domain entity ready. All story phases can proceed.

---

## Phase 3: US1 — Operations Staff Submits a Pending Call (P1)

**Goal**: Frontend form → `POST /api/v1/call-request` → backend passes `dynamic_variables` to ElevenLabs → outbound call to shop. Initial `in_progress` record written to DynamoDB.

**Independent Test**: Fill the form with a shop phone and 2 slots, submit. Verify ElevenLabs API call is made with correct `dynamic_variables`. Verify `conversationId` is returned to the frontend.

### Tests for US1 — Write FIRST (ensure RED before implementing)

- [X] T014 [US1] Write unit test for `InitiateCallUseCase` in `src/backend/tests/unit/useCases/InitiateCallUseCase.test.ts`:
  - (a) Valid input with 2 slots → calls ElevenLabs API with `to_number: shopPhone` and `conversation_initiation_client_data.dynamic_variables: { slot_1, slot_2 }`
  - (b) Valid input with 4 slots → all four slots included in `dynamic_variables`; `slot_3`/`slot_4` omitted when only 2 slots provided
  - (c) Empty `customerSlots` array → throws validation error, no API call made
  - (d) Returns `conversationId` from ElevenLabs response
  - (e) ElevenLabs API fails before returning `conversationId` → no DynamoDB record written, error propagated to handler (RED)
- [X] T015 [P] [US1] Write unit test for updated `callRequestHandler` in `src/backend/tests/unit/handlers/callRequestHandler.test.ts`:
  - (a) Valid body `{ shopPhone, customerSlots: [slot_1, slot_2], submittedAt }` → 200 `{ conversationId, callSid, message }`
  - (b) Missing `shopPhone` → 400 with `VALIDATION_ERROR`
  - (c) `customerSlots` with 5 items → 400 with `VALIDATION_ERROR`
  - (d) ElevenLabs API throws → 502 with `UPSTREAM_ERROR`
  - (e) CORS headers present on all responses (RED)
- [X] T016 [P] [US1] Write unit test for `PendingCallForm` component in `src/frontend/tests/unit/components/PendingCallForm.test.tsx`:
  - (a) Renders shop phone field and two default slot pickers
  - (b) "Add Slot" button is visible when fewer than 4 slots exist; hidden/disabled when 4 slots are present
  - (c) Submit with a past date → inline validation error shown, no API call made
  - (d) Submit with valid data → calls `initiateCall` use case and shows success chip with `conversationId` (RED)

### Implementation for US1

- [X] T017 [US1] Update `callRequestHandler.ts` at `src/backend/src/presentation/handlers/callRequestHandler.ts`:
  - Accept new request body: `{ shopPhone: string, customerSlots: string[], submittedAt: string }`
  - Validate with Zod: `shopPhone` non-empty, `customerSlots` array of 1–4 non-empty strings
  - Delegate to `InitiateCallUseCase`
  - Return `{ conversationId, callSid, message }` with CORS headers
  - (GREEN for T015)
- [X] T018 [US1] Implement `InitiateCallUseCase` in `src/backend/src/application/useCases/InitiateCallUseCase.ts`:
  - Build `dynamic_variables` map: `{ slot_1: customerSlots[0], slot_2: customerSlots[1], ... }` (only include slots that are present — omit `slot_3`/`slot_4` if not provided)
  - Call `POST /v1/convai/twilio/outbound-call` with `{ agent_id, agent_phone_number_id, to_number: shopPhone, conversation_initiation_client_data: { dynamic_variables } }`. **Note**: if ElevenLabs accepts `dynamic_variables` as a top-level field rather than nested, confirm and adjust during implementation — test in T014(a) will catch the mismatch.
  - Only if ElevenLabs responds with a `conversation_id`: write initial `in_progress` record to `ICallRecordRepository` with `callId = conversation_id`
  - If ElevenLabs call fails: propagate error — do NOT write any DynamoDB record
  - Return `{ conversationId, callSid }`
  - (GREEN for T014)
- [X] T019 [P] [US1] Implement `callRequestClient` in `src/frontend/src/infrastructure/api/callRequestClient.ts`:
  - POST to `/api/v1/call-request` with `{ shopPhone, customerSlots, submittedAt }`
  - Returns `{ conversationId, callSid, message }`
- [X] T020 [P] [US1] Implement `initiateCall` use case in `src/frontend/src/application/useCases/initiateCall.ts`:
  - Calls `callRequestClient`
  - Returns the response or throws a typed error
- [X] T021 [US1] Implement `PendingCallForm` component in `src/frontend/src/presentation/components/PendingCallForm/PendingCallForm.tsx`:
  - MUI `TextField` for shop phone number
  - 1–4 `DateTimePicker` inputs from `@mui/x-date-pickers`; default slot 1 = tomorrow 10AM, slot 2 = day after tomorrow 2PM
  - "Add Slot" button (hidden when 4 slots present), "Remove" icon per slot (minimum 1 slot remains)
  - Client-side validation: all slots must be future dates; show inline MUI `FormHelperText` error on violation
  - On submit: format each `DateTimePicker` value as a natural English string using `dayjs` (e.g. `"October 10th 2023 between 8am and 11am"`) before building the `customerSlots[]` array — this is the format Daisy will read aloud
  - Call `initiateCall` use case; show MUI `CircularProgress` while loading; on success show green `Chip` with `conversationId`; on error show MUI `Alert`
  - Intoxalock brand colors: primary `#003366`, secondary `#0066CC`
  - (GREEN for T016)
- [X] T022 [US1] Update `src/frontend/src/presentation/pages/HomePage.tsx` to embed `PendingCallForm` in a MUI `Card` with title "Simulate Pending Call"
- [X] T023 [US1] Update `src/Infra/lambda.tf`:
  - Add env vars `DYNAMODB_TABLE_NAME` and existing ElevenLabs vars to the `callRequestHandler` Lambda function resource
  - Add new Lambda function resource `intoxalock-call-webhook` pointing to `webhookHandler.ts` build output
  - Add new Lambda function resource `intoxalock-removal-requests` pointing to `removalRequestsHandler.ts` build output
- [X] T024 [P] [US1] Update `src/Infra/api_gateway.tf`:
  - Add route `POST /api/v1/webhook/call-completed` → `intoxalock-call-webhook` Lambda integration
  - Add route `GET /api/v1/removal-requests` → `intoxalock-removal-requests` Lambda integration

**Checkpoint**: Form submits → ElevenLabs call triggered → `in_progress` record in DynamoDB. Validate with `curl` per `quickstart.md`.

---

## Phase 4: US2 — Post-Call Webhook Received and Result Persisted (P2)

**Goal**: `POST /api/v1/webhook/call-completed` receives ElevenLabs post-call webhook, determines status, upserts DynamoDB record.

**Independent Test**: POST simulated webhook with `confirmed_slot` non-empty → record in DynamoDB with `status=confirmed`. POST with `shop_suggested_slot_1` non-empty and empty `confirmed_slot` → `status=needs_recontact`. POST with all empty → `status=failed`.

### Tests for US2 — Write FIRST (ensure RED before implementing)

- [X] T025 [US2] Write unit test for `RecordCallWebhookUseCase` in `src/backend/tests/unit/useCases/RecordCallWebhookUseCase.test.ts`:
  - (a) Payload with non-empty `confirmed_slot` → `repository.save()` called with `status=confirmed`, `confirmedSlot` set
  - (b) Payload with empty `confirmed_slot` + non-empty `shop_suggested_slot_1` → `status=needs_recontact`, `shopSuggestedSlots` is JSON of both shop slots
  - (c) Payload with all empty values → `status=failed`, no slot fields set
  - (d) Duplicate `callId` → `repository.save()` called (upsert — no error thrown) (RED)
- [X] T026 [P] [US2] Write unit test for `webhookHandler` in `src/backend/tests/unit/handlers/webhookHandler.test.ts`:
  - (a) Valid payload with `confirmed_slot` → 200 `{"message":"ok"}`
  - (b) Valid payload with empty data collection results → 200 `{"message":"ok"}`, status=failed persisted
  - (c) Malformed JSON body → 400 `VALIDATION_ERROR`
  - (d) Missing `data.conversation_id` → 400 `VALIDATION_ERROR`
  - (e) CORS headers present (RED)

### Implementation for US2

- [X] T027 [US2] Implement `RecordCallWebhookUseCase` in `src/backend/src/application/useCases/RecordCallWebhookUseCase.ts`:
  - Accept raw webhook payload (typed with Zod)
  - Extract `data.conversation_id`, `data.data_collection_results.confirmed_slot.value`, `shop_suggested_slot_1.value`, `shop_suggested_slot_2.value`
  - Determine status per logic in `data-model.md`
  - Build `CallRecord` with `confirmedSlot` or `shopSuggestedSlots` populated as appropriate
  - Call `repository.save()` (upsert)
  - (GREEN for T025)
- [X] T028 [US2] Implement `webhookHandler` in `src/backend/src/presentation/handlers/webhookHandler.ts`:
  - Thin Lambda handler: parse JSON body, validate `data.conversation_id` present, delegate to `RecordCallWebhookUseCase`
  - Return 200 for any valid payload (including failed calls); 400 for malformed JSON or missing `conversation_id`; 500 for unexpected errors
  - Include CORS headers
  - (GREEN for T026)

**Checkpoint**: POST simulated webhooks with `curl`, verify DynamoDB records created with correct status.

---

## Phase 5: US3 — Dashboard Shows All Call Records with Outcomes (P3)

**Goal**: `GET /api/v1/removal-requests` returns all records. Frontend `/requests` renders them in a MUI table with color-coded status badges.

**Independent Test**: Seed records with all three statuses. Navigate to `/requests`. Confirm table renders correct rows, columns, and badge colors.

### Tests for US3 — Write FIRST (ensure RED before implementing)

- [X] T029 [US3] Write unit test for `GetCallRecordsUseCase` in `src/backend/tests/unit/useCases/GetCallRecordsUseCase.test.ts`:
  - (a) Calls `repository.findAll()` and returns result unchanged
  - (b) Returns empty array when repo returns empty (RED)
- [X] T030 [P] [US3] Write unit test for `removalRequestsHandler` in `src/backend/tests/unit/handlers/removalRequestsHandler.test.ts`:
  - (a) Returns `{ "records": [...] }` with HTTP 200
  - (b) Returns `{ "records": [] }` when store is empty
  - (c) CORS headers present (RED)
- [X] T031 [P] [US3] Write unit test for `CallRecordsTable` component in `src/frontend/tests/unit/components/CallRecordsTable.test.tsx`:
  - (a) Renders correct column headers: Shop Phone, Submitted At, Status, Confirmed Slot, Shop Suggested Slots
  - (b) Renders one row per record with correct cell values
  - (c) `confirmed` record → green `Chip`; `needs_recontact` → orange `Chip`; `failed` → red `Chip`; `in_progress` → grey `Chip` with label "In Progress" and empty slot columns
  - (d) Renders empty-state message when `records=[]` (RED)
- [X] T032 [P] [US3] Write unit test for `RequestsDashboardPage` in `src/frontend/tests/unit/pages/RequestsDashboardPage.test.tsx`:
  - (a) Shows MUI `CircularProgress` while fetching
  - (b) Renders `CallRecordsTable` when records load
  - (c) Shows MUI `Alert` on API failure (RED)
- [X] T033 [P] [US3] Write integration test for sort order in `src/backend/tests/integration/handlers/removalRequestsHandler.test.ts`:
  - Seed 3 records with distinct `submittedAt` values
  - Call GET handler
  - Assert `records[0].submittedAt` is the latest timestamp (RED)

### Implementation for US3

- [X] T034 [US3] Implement `GetCallRecordsUseCase` in `src/backend/src/application/useCases/GetCallRecordsUseCase.ts`:
  - Calls `repository.findAll()`, returns result (repository already sorts desc)
  - (GREEN for T029)
- [X] T035 [US3] Implement `removalRequestsHandler` in `src/backend/src/presentation/handlers/removalRequestsHandler.ts`:
  - Thin Lambda handler: delegate to `GetCallRecordsUseCase`, return `{ records }` with CORS headers
  - (GREEN for T030)
- [X] T036 [P] [US3] Implement `callRecordsClient` in `src/frontend/src/infrastructure/api/callRecordsClient.ts`:
  - Fetch `GET /api/v1/removal-requests`, return typed `CallRecord[]`
- [X] T037 [P] [US3] Implement `getCallRecords` use case in `src/frontend/src/application/useCases/getCallRecords.ts`:
  - Calls `callRecordsClient`, returns records array
- [X] T038 [US3] Implement `CallRecordsTable` component in `src/frontend/src/presentation/components/CallRecordsTable/CallRecordsTable.tsx`:
  - MUI `Table` with columns: Shop Phone, Submitted At, Status, Confirmed Slot, Shop Suggested Slots
  - Status column: MUI `Chip` — `color="success"` (confirmed), `sx={{ bgcolor: 'orange' }}` label "Needs Recontact" (needs_recontact), `color="error"` (failed), `sx={{ bgcolor: 'grey.400' }}` label "In Progress" (in_progress)
  - For `in_progress` records: Confirmed Slot and Shop Suggested Slots columns render empty (dash or blank)
  - `customerSlots` and `shopSuggestedSlots` columns: call `JSON.parse()` on raw string, render as comma-separated list
  - Empty state: MUI `Typography` "No call records yet" when `records.length === 0`
  - (GREEN for T031)
- [X] T039 [US3] Implement `RequestsDashboardPage` in `src/frontend/src/presentation/pages/RequestsDashboardPage.tsx`:
  - Fetches records via `getCallRecords` use case on mount
  - Shows MUI `CircularProgress` while loading
  - Shows `CallRecordsTable` when loaded
  - Shows MUI `Alert` severity="error" on failure
  - Page title: MUI `Typography` variant="h4" "Call Records" in Intoxalock primary color `#003366`
  - (GREEN for T032)
- [X] T040 [US3] Update `src/frontend/src/App.tsx`:
  - Wrap with `BrowserRouter` from `react-router-dom`
  - Add `Routes` with two `Route` entries: `path="/"` → `HomePage`, `path="/requests"` → `RequestsDashboardPage`
- [X] T041 [P] [US3] Verify `DynamoCallRecordRepository.findAll()` sorts results by `submittedAt` descending after Scan — confirmed in T012; add explicit assertion in integration test if not already present (GREEN for T033)

**Checkpoint**: Dashboard page live at `/requests`. Navigate in browser, verify all three status types render correctly.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T042 [P] Ensure all env vars (`ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_AGENT_PHONE_NUMBER_ID`, `DYNAMODB_TABLE_NAME`) are wired as Lambda environment variables in `src/Infra/lambda.tf` for all three Lambda functions (`callRequestHandler`, `webhookHandler`, `removalRequestsHandler`)
- [X] T043 [P] Run `tsc --noEmit` in `src/backend` — fix any type errors
- [X] T044 [P] Run `tsc --noEmit` in `src/frontend` — fix any type errors
- [X] T045 [P] Run `eslint` in `src/backend` — fix lint errors
- [X] T046 [P] Run `eslint` in `src/frontend` — fix lint errors
- [X] T047 Run full test suite in `src/backend` (`npm test`) — all tests must pass
- [X] T048 [P] Run full test suite in `src/frontend` (`npm test`) — all tests must pass
- [X] T049 [P] Add a "View Call Records" navigation link to the frontend header/nav in `src/frontend/src/App.tsx` (or a `NavBar` component) pointing to `/requests`
- [X] T050 [P] Update `specs/002-call-records-dashboard/quickstart.md` with new `curl` examples for all three endpoints and manual ElevenLabs agent setup checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Requires Phase 1 — blocks all story phases
- **Phase 3 (US1)**: Requires Phase 2
- **Phase 4 (US2)**: Requires Phase 2 (Lambda Terraform resources from T023/T024 are shared — coordinate with US1)
- **Phase 5 (US3)**: Requires Phase 2; integrates backend handler from Phase 4 (T035) into GET endpoint; frontend is independent of US2 backend
- **Phase 6 (Polish)**: Requires all story phases

### Within Each User Story

1. Tests MUST be written and confirmed RED before implementation begins
2. Domain entity (`CallRecord`) before use cases
3. Use cases before handlers
4. Backend handler before Terraform route (route needs Lambda ARN)
5. Frontend: client → use case → component → page → router update

### Parallel Opportunities

| Group | Tasks |
|---|---|
| Phase 1 parallel | T002, T003, T004, T005, T007 alongside T001, T006 |
| Phase 2 parallel | T009, T010, T013 alongside T008 |
| US1 tests | T014, T015, T016 in parallel |
| US1 frontend | T019, T020 in parallel after T018 |
| US2 tests | T025, T026 in parallel |
| US3 tests | T029, T030, T031, T032, T033 all in parallel |
| US3 frontend impl | T036, T037 in parallel after T034/T035 |
| Polish | T042–T050 all parallelizable |

---

## Implementation Strategy

### MVP (US1 only — call initiation working)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1
4. **STOP AND VALIDATE**: Submit form → ElevenLabs call fires to shop → `in_progress` record in DynamoDB

### Incremental Delivery

1. Setup + Foundational → shared infrastructure ready
2. US1 → call initiation + `in_progress` record → validate
3. US2 → webhook ingestion + final status → validate all three statuses with simulated payloads
4. US3 → dashboard live → validate in browser → polish → ship

---

## Notes

- [P] = different files, no inter-task dependencies within the same phase
- Tests MUST fail (RED) before implementation (GREEN)
- All entity names use `CallRecord` (not `RemovalRequestRecord` from previous spec)
- `customerSlots` and `shopSuggestedSlots` are stored as JSON strings in DynamoDB — always `JSON.stringify()` before save, `JSON.parse()` before render
- Manual ElevenLabs agent configuration (system prompt with `{{slot_1}}`–`{{slot_4}}`, Data Collection variables) is required before end-to-end testing — see `agent-prompt.md`
- Commit after each phase checkpoint
