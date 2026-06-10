# Tasks: Intoxalock Device Removal Call Automation

**Input**: Design documents from `specs/001-device-removal-call/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: Included — Constitution mandates TDD (Test-First is NON-NEGOTIABLE). Write tests first, verify they fail, then implement.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Initialize both projects and configure tooling

- [X] T001 Create root directory structure: `frontend/` and `backend/` at repo root per plan.md
- [X] T002 Initialize frontend: `npm create vite@latest frontend -- --template react-ts`, then install MUI v6, `mui-tel-input`, `react-hook-form`, `zod`, `@hookform/resolvers`, `libphonenumber-js` in `frontend/`
- [X] T003 Initialize backend: `npm init` + install TypeScript, `ts-node`, `@types/node`, `zod` and create `tsconfig.json` targeting `es2020`, `module: commonjs` in `backend/`
- [X] T003b [P] Initialize Terraform project: create `infra/` directory with `main.tf` (provider `aws`, required version), `variables.tf`, `outputs.tf`, and `terraform.tfvars.example` at repo root
- [X] T004 [P] Configure ESLint + Prettier for frontend in `frontend/.eslintrc.cjs` and `frontend/.prettierrc`
- [X] T005 [P] Configure ESLint + Prettier for backend in `backend/.eslintrc.cjs` and `backend/.prettierrc`
- [X] T006 [P] Configure Vitest + React Testing Library for frontend: install `vitest`, `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` and add `test` config to `frontend/vite.config.ts`
- [X] T007 [P] Configure Jest + ts-jest for backend: install `jest`, `ts-jest`, `@types/jest` and create `backend/jest.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure shared across all user stories — MUST complete before any story work begins

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Create MUI Intoxalock theme with brand tokens (`primary.main=#003366`, `primary.dark=#002244`, `secondary.main=#0066CC`, `background.default=#F5F5F5`, font `Arial`) in `frontend/src/presentation/theme/intoxalockTheme.ts`
- [X] T009 [P] Create `RemovalRequest` domain entity (fields: `fullName`, `phoneNumber` E.164, `tcpaConsent`, `submittedAt`) in `backend/src/domain/entities/RemovalRequest.ts`
- [X] T010 [P] Create `CallRecord` domain entity (fields: `conversationId`, `callSid`, `success`, `message`, `initiatedAt`) in `backend/src/domain/entities/CallRecord.ts`
- [X] T011 Create `ICallService` port interface (method: `initiateCall(request: RemovalRequest): Promise<CallRecord>`) in `backend/src/domain/ports/ICallService.ts`
- [X] T012 [P] Create `DomainErrors` with typed error classes (`ValidationError`, `CallServiceError`, `TimeoutError`) in `backend/src/domain/errors/DomainErrors.ts`
- [X] T013 [P] Create `RemovalRequest` domain entity (fields: `fullName`, `countryCode`, `dialCode`, `localPhoneNumber`, `phoneNumber`, `tcpaConsent`, `submittedAt`) in `frontend/src/domain/entities/RemovalRequest.ts`
- [X] T014 [P] Create `CallRecord` domain entity (fields: `conversationId`, `callSid`, `message`) in `frontend/src/domain/entities/CallRecord.ts`
- [X] T015 Create App shell with `ThemeProvider` (intoxalockTheme) + `CssBaseline` in `frontend/src/App.tsx`

**Checkpoint**: Foundation complete — all user story phases can now begin

---

## Phase 3: User Story 1 — Submit Device Removal Request (Priority: P1) 🎯 MVP

**Goal**: Customer fills name + phone number, submits form, outbound AI call is triggered, confirmation screen shown with `conversationId`.

**Independent Test**: Submit form with valid data → confirmation screen appears with a call reference ID and "An AI Agent will contact you shortly" message.

### Tests for User Story 1 (write first — MUST FAIL before implementation)

- [X] T016 [P] [US1] Write unit test for `InitiateRemovalCallUseCase`: mock `ICallService`, assert it calls `initiateCall` with correct `RemovalRequest` and returns `CallRecord` in `backend/tests/unit/useCases/InitiateRemovalCallUseCase.test.ts`
- [X] T017 [P] [US1] Write unit test for `submitRemovalRequest` frontend use case: mock `callRequestClient`, assert it posts the assembled E.164 payload and returns `CallRecord` in `frontend/tests/unit/useCases/submitRemovalRequest.test.ts`
- [X] T018 [P] [US1] Write integration test for `ElevenLabsCallService`: assert it calls `POST https://api.elevenlabs.io/v1/convai/twilio/outbound-call` with correct `xi-api-key` header and body (use `jest.spyOn(global, 'fetch')`) in `backend/tests/integration/elevenlabs/ElevenLabsCallService.test.ts`
- [X] T018b [P] [US1] Write integration test for `callRequestHandler`: construct a mock API Gateway v2 proxy event with valid payload, invoke handler directly, assert HTTP 200 + `conversationId` in response body; test 400 on invalid payload; test 502 when `ICallService` throws — in `backend/tests/integration/handlers/callRequestHandler.test.ts`

### Implementation for User Story 1

- [X] T019 [US1] Implement `ElevenLabsCallService` (implements `ICallService`): reads `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_AGENT_PHONE_NUMBER_ID` from `process.env`, calls ElevenLabs API with `xi-api-key` header, returns `CallRecord` in `backend/src/infrastructure/elevenlabs/ElevenLabsCallService.ts`
- [X] T020 [US1] Implement `InitiateRemovalCallUseCase`: accepts `RemovalRequest`, delegates to `ICallService`, returns `CallRecord` in `backend/src/application/useCases/InitiateRemovalCallUseCase.ts`
- [X] T021 [US1] Implement `callRequestHandler` Lambda: typed as `APIGatewayProxyEventV2` handler, parse `event.body` JSON, call `InitiateRemovalCallUseCase`, return `200` with `CallRecord` or structured error with CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`). MUST NOT log `phoneNumber` or `fullName` in plaintext (log only `submittedAt` and result status) in `backend/src/presentation/handlers/callRequestHandler.ts`
- [X] T022 [US1] Create Terraform Lambda + API Gateway resources in `infra/lambda.tf` and `infra/api_gateway.tf`: `aws_lambda_function` (runtime `nodejs18.x`, **`timeout = 30`**, handler `src/presentation/handlers/callRequestHandler.handler`), `aws_iam_role` + `aws_iam_role_policy_attachment` (CloudWatch Logs), `aws_lambda_permission` (allow API Gateway invoke), env vars block with `ELEVENLABS_API_KEY`/`ELEVENLABS_AGENT_ID`/`ELEVENLABS_AGENT_PHONE_NUMBER_ID`; `aws_apigatewayv2_api` (protocol `HTTP`), `aws_apigatewayv2_stage` (auto-deploy), `aws_apigatewayv2_integration` (Lambda proxy), `aws_apigatewayv2_route` (`POST /api/v1/call-request`), CORS configuration allowing CloudFront origin
- [X] T022b [US1] Create Terraform S3 + CloudFront resources in `infra/s3_cloudfront.tf` (depends on T022 — share same `main.tf`/provider): `aws_s3_bucket` (private, versioning enabled), `aws_s3_bucket_public_access_block`, `aws_cloudfront_origin_access_control`, `aws_cloudfront_distribution` (default root `index.html`, custom error 403/404 → `index.html` status 200 for SPA routing), `aws_s3_bucket_policy` allowing CloudFront OAC read
- [X] T023 [US1] Implement `callRequestClient`: `fetch` wrapper that posts `CallRequestPayload` to `${VITE_API_BASE_URL}/api/v1/call-request` and returns `CallRecord` or throws typed error in `frontend/src/infrastructure/api/callRequestClient.ts`
- [X] T024 [US1] Implement `submitRemovalRequest` use case: accepts `RemovalRequest`, calls `callRequestClient`, returns `CallRecord` in `frontend/src/application/useCases/submitRemovalRequest.ts`
- [X] T025 [US1] Implement `PhoneInput` component using `mui-tel-input`: default country `US`, expose `value` (E.164 assembled) and `onChange` props in `frontend/src/presentation/components/RequestForm/PhoneInput.tsx`
- [X] T026 [US1] Implement `RequestForm` component: Full Name `TextField` + `PhoneInput` + submit `Button` (disabled while submitting), call `submitRemovalRequest` on submit, disable button on first click in `frontend/src/presentation/components/RequestForm/RequestForm.tsx`
- [X] T027 [US1] Create `HomePage` that renders `RequestForm` and transitions to `ConfirmationScreen` on success (stub `ConfirmationScreen` with placeholder text for now) in `frontend/src/presentation/pages/HomePage.tsx`

**Checkpoint**: US1 fully functional — form submits, call triggers, confirmation screen shows `conversationId`

---

## Phase 4: User Story 2 — Form Validation & Error Feedback (Priority: P2)

**Goal**: Invalid submissions are caught client-side with inline error messages before any API call is made. Backend also rejects invalid payloads with `400`.

**Independent Test**: Submit empty form → inline errors on both fields. Submit with unchecked consent → Submit button stays disabled. Invalid phone → inline error on phone field.

### Tests for User Story 2 (write first — MUST FAIL before implementation)

- [X] T028 [P] [US2] Write unit tests for `RequestForm` validation: empty name shows error, invalid phone shows error, unchecked consent keeps button disabled, valid data enables button in `frontend/tests/unit/components/RequestForm.test.tsx`
- [X] T029 [P] [US2] Write unit test for backend validation in `callRequestHandler`: missing `fullName` → 400, invalid `phoneNumber` → 400, `tcpaConsent: false` → 400 in `backend/tests/unit/handlers/callRequestHandler.test.ts`

### Implementation for User Story 2

- [X] T030 [US2] Define Zod schema `removalRequestSchema` (fullName non-empty max 100, phoneNumber E.164 regex `/^\+[1-9]\d{6,14}$/`, tcpaConsent `literal(true)`) in `frontend/src/domain/entities/RemovalRequest.ts`
- [X] T031 [US2] Integrate `react-hook-form` + `zodResolver(removalRequestSchema)` into `RequestForm`; add inline `FormHelperText` error messages under each field in `frontend/src/presentation/components/RequestForm/RequestForm.tsx`
- [X] T032 [US2] Implement `ConsentCheckbox` component: MUI `FormControlLabel` + `Checkbox` with TCPA consent text and inline T&C link; required for form submission in `frontend/src/presentation/components/RequestForm/ConsentCheckbox.tsx`
- [X] T033 [US2] Add Zod validation in `callRequestHandler`: validate payload with shared schema, return `{ error, code: "VALIDATION_ERROR" }` with status `400` on failure in `backend/src/presentation/handlers/callRequestHandler.ts`

**Checkpoint**: US1 + US2 complete — form validates inline, bad data never reaches backend

---

## Phase 5: User Story 3 — Call Confirmation Screen (Priority: P3)

**Goal**: After successful submission, customer sees a static confirmation screen with `conversationId` and "An AI Agent will contact you shortly." On failure, a one-click retry re-submits the same data automatically.

**Independent Test**: Mock successful API response → confirmation screen renders with `conversationId` and static message. Mock failed API response → error screen renders with retry button that re-submits without re-entry.

### Tests for User Story 3 (write first — MUST FAIL before implementation)

- [X] T034 [P] [US3] Write unit tests for `ConfirmationScreen`: renders `conversationId`, renders static message, renders "Submit Another Request" button in `frontend/tests/unit/components/ConfirmationScreen.test.tsx`
- [X] T035 [P] [US3] Write unit tests for error + retry state in `HomePage`: error state renders retry button, clicking retry re-calls `submitRemovalRequest` with the same payload without re-entry in `frontend/tests/unit/pages/HomePage.test.tsx`

### Implementation for User Story 3

- [X] T036 [US3] Implement `ConfirmationScreen` component: display `conversationId`, static message "Your request has been received. An AI Agent will contact you shortly.", and "Submit Another Request" button that resets to form in `frontend/src/presentation/components/ConfirmationScreen/ConfirmationScreen.tsx`
- [X] T037 [US3] Implement error state in `HomePage`: when `submitRemovalRequest` throws, show MUI `Alert` with error message and a "Try Again" `Button`; clicking it re-invokes `submitRemovalRequest` with the same `RemovalRequest` held in state — no re-entry required in `frontend/src/presentation/pages/HomePage.tsx`
- [X] T038 [US3] Finalize page-level state machine in `HomePage` (states: `IDLE → SUBMITTING → CONFIRMED | ERROR → SUBMITTING`) and replace the US1 `ConfirmationScreen` stub with the real component in `frontend/src/presentation/pages/HomePage.tsx`

**Checkpoint**: All three user stories independently functional and testable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Environment config, brand details, final quality gates

- [X] T039 [P] Create `frontend/.env.local.example` with `VITE_API_BASE_URL=https://<cloudfront-domain>` and `frontend/.env.development.local` with `VITE_API_BASE_URL=http://localhost:9000`; add `.env*.local` to `frontend/.gitignore`
- [X] T040 [P] Create `infra/terraform.tfvars.example` with all variable placeholders (`elevenlabs_api_key`, `elevenlabs_agent_id`, `elevenlabs_agent_phone_number_id`, `aws_region`) and add `terraform.tfvars` to root `.gitignore`
- [X] T041 [P] Add Intoxalock brand header to `HomePage`: logo/brand name area using MUI `AppBar` or `Box` with primary color `#003366` and white text in `frontend/src/presentation/pages/HomePage.tsx`
- [X] T042 [P] Run all frontend tests (`npm test` in `frontend/`) — all must pass; fix any failures
- [X] T043 [P] Run all backend tests (`npm test` in `backend/`) — all must pass; fix any failures
- [X] T044 Run TypeScript strict type check (`tsc --noEmit`) in both `frontend/` and `backend/` — zero errors
- [X] T045 [P] Run `terraform validate` + `terraform plan` in `infra/` — zero errors
- [X] T046 Validate end-to-end happy path using `quickstart.md` Scenario 1: invoke Lambda locally with test event + `npm run dev` frontend, submit valid form, verify confirmation screen and call trigger
- [X] T047 Update `quickstart.md`: (a) replace local dev section — remove `sam local`, add instructions to invoke Lambda handler directly via `ts-node` or deploy to AWS and point frontend to the real API Gateway URL; (b) update deploy section to Terraform workflow: `terraform apply` → `aws s3 sync dist/ s3://<bucket>` → `aws cloudfront create-invalidation`; (c) unify local dev port to `3000` across all references in `quickstart.md` and `frontend/.env.development.local`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Phase 1 complete — **BLOCKS all user stories**
- **US1 (Phase 3)**: Requires Phase 2 complete — no dependency on US2/US3
- **US2 (Phase 4)**: Requires Phase 2 complete — builds on US1 `RequestForm` component
- **US3 (Phase 5)**: Requires Phase 2 complete — builds on US1 confirmation flow and US2 error state
- **Polish (Phase 6)**: Requires all desired stories complete

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2 — pure core flow
- **US2 (P2)**: Extends `RequestForm` and `callRequestHandler` created in US1 — start after T026 and T021
- **US3 (P3)**: Extends `HomePage` state machine from US1 — start after T027

### Within Each User Story

- Tests **MUST be written and fail** before implementation (TDD — Constitution Principle III)
- Domain entities → ports → infrastructure → application → presentation
- Core flow before error/edge case handling

---

## Parallel Opportunities

### Phase 1

```
T002 (frontend init) ║ T003 (backend init) ║ T003b (Terraform init)
T004 (FE lint)       ║ T005 (BE lint)
T006 (FE test cfg)   ║ T007 (BE test cfg)
```

### Phase 2

```
T009 (BE RemovalRequest entity)  ║ T010 (BE CallRecord entity)
T012 (BE DomainErrors)           ║ T013 (FE RemovalRequest entity)
                                  ║ T014 (FE CallRecord entity)
```

### Phase 3 (US1) — Tests run together before implementation

```
T016 (UC test: InitiateRemovalCallUseCase) ║ T017 (UC test: submitRemovalRequest) ║ T018 (integration test: ElevenLabsCallService)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL — blocks everything**)
3. Complete Phase 3: User Story 1 (T016–T027)
4. **STOP and VALIDATE**: Run quickstart.md Scenario 1 end-to-end
5. Demo the core call trigger flow

### Incremental Delivery

1. Setup + Foundational → infra ready
2. **US1** → working call trigger + confirmation (MVP demo)
3. **US2** → form validation hardened
4. **US3** → polished confirmation + retry UX
5. Polish → brand, tests green, TypeScript clean

### Parallel Team Strategy

Once Phase 2 is complete:
- **Developer A**: US1 backend (T019–T022)
- **Developer B**: US1 frontend (T023–T027)
- Sync at T027 to integrate and test end-to-end

---

## Notes

- `[P]` tasks operate on different files — safe to parallelize
- `[Story]` label maps each task to its user story for traceability
- Tests MUST fail before implementation — Red → Green → Refactor (Constitution Principle III)
- Never commit `env.json` or `.env.local` — secrets in env vars only (Constitution Principle V)
- Commit after each checkpoint to keep history clean
- Stop at any checkpoint to validate the story independently before proceeding
