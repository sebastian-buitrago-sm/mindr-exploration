# Feature Specification: Call Records Dashboard

**Feature Branch**: `002-call-records-dashboard`

**Created**: 2026-06-10

**Status**: Draft (Revised)

## Overview

Intoxalock operations staff need to schedule device-removal appointments between customers and their assigned service centers (talleres/shops). This feature enables staff to submit a "pending call" — providing the shop's phone number and up to four customer-proposed time slots — which triggers Daisy (an ElevenLabs AI agent) to call the shop on Intoxalock's behalf. Daisy negotiates a time slot, and the result is stored and shown in a dashboard.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Operations Staff Submits a Pending Call (Priority: P1)

An operations staff member fills out a form with a shop phone number and one to four customer time slots, then submits it. The backend triggers an outbound ElevenLabs call to the shop (Daisy calls the shop), passing the customer's availability as dynamic variables so Daisy can propose them during the conversation.

**Why this priority**: Without the ability to initiate calls, there is nothing to store or display. This is the entry point of the entire flow.

**Independent Test**: Submit the form with a valid shop phone and two slots. Verify the backend calls the ElevenLabs API with the correct `dynamic_variables` and returns a `conversationId`. The call should reach the shop phone.

**Acceptance Scenarios**:

1. **Given** the form is open, **When** staff enters a shop phone number and at least one future time slot and submits, **Then** the backend initiates an outbound ElevenLabs call to the shop phone with the customer slots passed as dynamic variables.
2. **Given** the form is submitted with two slots, **When** the backend receives the request, **Then** `slot_1` and `slot_2` are passed as ElevenLabs dynamic variables; `slot_3` and `slot_4` are omitted.
3. **Given** the form is open, **When** staff tries to submit with no slots or a slot with a past date, **Then** a validation error is shown and the form is not submitted.
4. **Given** the form is open, **When** staff adds a slot beyond the fourth, **Then** the "Add slot" button is disabled.
5. **Given** the form is submitted successfully, **When** the backend returns a response, **Then** the frontend shows a success message with the `conversationId`.

---

### User Story 2 — Post-Call Webhook Received and Result Persisted (Priority: P2)

After Daisy finishes the call with the shop, ElevenLabs fires a post-call webhook. The backend receives it, extracts the outcome (confirmed slot, shop-suggested slots, or failure), and persists a record to DynamoDB.

**Why this priority**: The call result must be stored before it can be displayed. Depends on US1 calls being triggered.

**Independent Test**: POST a simulated webhook payload with a `confirmed_slot` value and verify a DynamoDB record is created with `status = confirmed` and the correct `confirmedSlot`. POST a payload with shop-suggested slots and verify `status = needs_recontact`. POST a payload with no useful data and verify `status = failed`.

**Acceptance Scenarios**:

1. **Given** Daisy confirmed one of the customer slots with the shop, **When** the webhook fires, **Then** a DynamoDB record is created with `status = confirmed` and `confirmedSlot` set to the accepted slot string.
2. **Given** the shop rejected all customer slots and proposed their own times, **When** the webhook fires, **Then** a record is created with `status = needs_recontact` and `shopSuggestedSlots` containing the shop's proposed times.
3. **Given** the call ended without any usable outcome, **When** the webhook fires, **Then** a record is created with `status = failed`.
4. **Given** a webhook with a `callId` that already exists in DynamoDB, **When** it is received again, **Then** the record is upserted (overwritten) — no duplicates.
5. **Given** a webhook payload that is structurally malformed (invalid JSON), **When** it is received, **Then** the endpoint returns HTTP 400.

---

### User Story 3 — Dashboard Shows All Call Records with Outcomes (Priority: P3)

An operations staff member opens the `/requests` dashboard and sees a table of all call records. Each row shows the shop phone, submission time, status badge (confirmed / needs_recontact / failed), the confirmed slot if applicable, and the shop-suggested slots if the customer needs to be re-contacted.

**Why this priority**: This is the visibility layer — staff need to know which calls resolved cleanly, which require follow-up, and which failed.

**Independent Test**: Seed records with all three statuses. Navigate to `/requests`. Verify each row shows the correct status badge color and the appropriate slot columns populated.

**Acceptance Scenarios**:

1. **Given** there are records in DynamoDB, **When** staff navigates to `/requests`, **Then** a table is displayed with columns: Shop Phone, Submitted At, Status, Confirmed Slot, Shop Suggested Slots.
1a. **Given** a record with `status = in_progress`, **When** rendered in the table, **Then** the status badge is grey with label "In Progress" and the Confirmed Slot / Shop Suggested Slots columns are empty.
2. **Given** a record with `status = confirmed`, **When** rendered in the table, **Then** the status badge is green.
3. **Given** a record with `status = needs_recontact`, **When** rendered in the table, **Then** the status badge is orange and the shop-suggested slots are shown.
4. **Given** a record with `status = failed`, **When** rendered in the table, **Then** the status badge is red.
5. **Given** there are no records yet, **When** staff navigates to `/requests`, **Then** an empty-state message is shown (e.g., "No call records yet").
6. **Given** the dashboard is open, **When** the user refreshes the page, **Then** the latest records are fetched and displayed.

---

### Edge Cases

- A slot provided by staff has a past date/time — frontend validation must reject it before submission.
- ElevenLabs returns an error when the call is initiated — backend returns 502 to the frontend with a descriptive error.
- The webhook arrives before the initial call record is written (race condition at POC scale is acceptable — webhook creates a new record).
- Dashboard with a large number of records — pagination is out of scope for POC; all records loaded in a single scan.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose `POST /api/v1/call-request` that accepts a shop phone number and an array of 1–4 customer time slots (future dates only).
- **FR-002**: The `POST /api/v1/call-request` endpoint MUST pass each customer slot as an ElevenLabs dynamic variable (`slot_1` through `slot_4`) via `conversation_initiation_client_data.dynamic_variables` in the body of `POST /v1/convai/twilio/outbound-call`. Only slots that are present are included; omitted slots are not passed.
- **FR-003**: The `POST /api/v1/call-request` endpoint MUST return the ElevenLabs `conversationId` on success.
- **FR-004**: The system MUST expose `POST /api/v1/webhook/call-completed` that receives ElevenLabs post-call webhooks.
- **FR-005**: The webhook endpoint MUST extract `confirmed_slot`, `shop_suggested_slot_1`, and `shop_suggested_slot_2` from `data_collection_results` and determine the record status: `confirmed` if `confirmed_slot` is non-empty, `needs_recontact` if shop slots are present, otherwise `failed`.
- **FR-006**: The webhook endpoint MUST persist the result to DynamoDB using the schema defined in `data-model.md`.
- **FR-007**: The webhook endpoint MUST return HTTP 200 for any processable payload (including failed calls) and HTTP 400 only for structurally malformed JSON.
- **FR-008**: Duplicate webhook deliveries for the same `callId` MUST upsert (not duplicate) the DynamoDB record.
- **FR-009**: The system MUST expose `GET /api/v1/removal-requests` that returns all call records sorted by `submittedAt` descending.
- **FR-010**: The frontend MUST include a form (on the existing home page or a dedicated route) for submitting a pending call with shop phone + 1–4 time slots.
- **FR-011**: The frontend form MUST default slot 1 to tomorrow at 10:00 AM and slot 2 to the day after tomorrow at 2:00 PM. All slots must be validated as future date/times before submission. The frontend MUST format each selected date/time as a natural English string (e.g. `"October 10th 2023 between 8am and 11am"`) before sending to the backend.
- **FR-012**: The frontend MUST include a dashboard page at `/requests` displaying all call records with status badges.
- **FR-013**: The dashboard MUST follow the Intoxalock brand design system (primary `#003366`, secondary `#0066CC`, MUI components).
- **FR-014**: The dashboard MUST display `in_progress` records with a grey status badge and empty slot columns. Status badge colors: grey = in_progress, green = confirmed, orange = needs_recontact, red = failed.

### Key Entities

- **CallRecord**: Represents one triggered call to a shop. Key attributes: callId, submittedAt, shopPhone, customerSlots, status, confirmedSlot, shopSuggestedSlots.

---

## Success Criteria *(mandatory)*

- **SC-001**: Submitting the form initiates an ElevenLabs outbound call within 5 seconds.
- **SC-002**: The webhook endpoint persists the call result within 3 seconds of receiving the payload.
- **SC-003**: The dashboard page loads and displays all records within 3 seconds.
- **SC-004**: 100% of webhook deliveries with a processable payload result in a DynamoDB record with the correct status.
- **SC-005**: Duplicate webhook deliveries for the same `callId` result in exactly one record.
- **SC-006**: Operations staff can read the call outcome from the dashboard without any training.

---

## Clarifications

### Session 2026-06-10 (revised)

- The AI agent (Daisy) calls the **shop** — NOT the customer. The customer has already provided their availability; Daisy proposes those slots to the shop.
- Customer slots are provided by operations staff at call-submission time and passed to ElevenLabs as dynamic variables (`slot_1` through `slot_4`).

### Session 2026-06-11

- Q: How should the backend pass customer time slots to Daisy at call initiation? → A: Via `conversation_initiation_client_data.dynamic_variables` in the body of `POST /v1/convai/twilio/outbound-call`. The agent prompt in ElevenLabs is configured with `{{slot_1}}`–`{{slot_4}}` placeholders (including `{{#if slot_2}}...{{/if}}` conditional blocks for optional slots); the backend injects only the slots that are present. Note: confirm during implementation whether `dynamic_variables` sits at top-level or nested — both formats have been referenced in docs.
- Q: What format should frontend use for slot strings passed as dynamic variables? → A: Natural English text built by the frontend from the date/time picker values, e.g. `"October 10th 2023 between 8am and 11am"`. Daisy reads this directly without transformation.
- Q: How should `in_progress` records appear in the dashboard? → A: Show a grey "In Progress" badge in the status column. Slot result columns are empty until the webhook updates the record. Staff reloads manually to see the final result.
- The webhook result captures what the shop agreed to (confirmed slot) or proposed (shop-suggested slots), or a failure if no agreement was reached.
- No authentication required on any endpoint — acceptable for POC demo scope.
- Pagination is out of scope — full scan on page load.
- Dashboard does not auto-refresh — manual page reload only.

---

## Assumptions

- The ElevenLabs agent (Daisy) is configured with a system prompt that uses `{{slot_1}}`–`{{slot_4}}` placeholders and Data Collection variables: `confirmed_slot`, `shop_suggested_slot_1`, `shop_suggested_slot_2`.
- The backend passes dynamic variables via `conversation_initiation_client_data.dynamic_variables` in the body of `POST /v1/convai/twilio/outbound-call` (confirmed from ElevenLabs API reference). The agent prompt in ElevenLabs must be configured with `{{slot_1}}`–`{{slot_4}}` placeholders. Dynamic variables accept string values; slots not provided by staff are omitted from the map (not passed as null).
- Customer time slots are stored as plain text strings (e.g., "October 10th 2023 8am to 11am") — no strict date format is enforced.
- The existing Lambda function project structure is extended (not replaced).
- The service center phone number is provided per-submission by staff (not hardcoded).
