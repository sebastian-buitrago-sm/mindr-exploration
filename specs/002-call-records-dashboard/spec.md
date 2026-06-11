# Feature Specification: Call Records Dashboard

**Feature Branch**: `002-call-records-dashboard`

**Created**: 2026-06-10

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - ElevenLabs Sends Call Data (Priority: P1)

After a voice agent call concludes, ElevenLabs fires a post-call webhook. The system receives the webhook payload, extracts the structured data collected during the call (name, contact info, two availability slots), and persists it as a removal request record.

**Why this priority**: Without data ingestion there is nothing to display. This is the foundation of the entire feature.

**Independent Test**: Can be tested by sending a simulated webhook payload and verifying a record appears in the data store. Delivers the core value of capturing call outcomes automatically.

**Acceptance Scenarios**:

1. **Given** a completed ElevenLabs call with all fields collected, **When** ElevenLabs fires the post-call webhook, **Then** a removal request record is created with name, contact info, both availability slots, call timestamp, and call ID.
2. **Given** a webhook payload where the user only provided email (no phone), **When** the webhook is received, **Then** the record is saved with email as the contact field and the phone field is empty.
3. **Given** a webhook payload where the user only provided a phone number (no email), **When** the webhook is received, **Then** the record is saved with phone as the contact field and the email field is empty.
4. **Given** a malformed or incomplete webhook payload missing required fields, **When** the webhook is received, **Then** the system returns an error response and does not create a partial record.

---

### User Story 2 - Operations Staff Views All Removal Requests (Priority: P2)

An operations staff member opens a dashboard URL in their browser and sees a table listing all submitted removal request calls, with the relevant details for each — who called, how to reach them, when they are available, and when the request was submitted.

**Why this priority**: This is the consumer of the ingested data and the primary business value of the feature — visibility into submitted requests.

**Independent Test**: Can be tested independently (with seeded data) by navigating to the dashboard URL and verifying the table renders all records correctly.

**Acceptance Scenarios**:

1. **Given** there are removal request records in the system, **When** a user navigates to the dashboard URL, **Then** a table is displayed showing all records with columns: Name, Contact Info, First Available Slot, Second Available Slot, Request Date/Time.
2. **Given** there are no records yet, **When** a user navigates to the dashboard URL, **Then** an empty-state message is shown (e.g., "No removal requests yet").
3. **Given** the dashboard is open, **When** the user refreshes the page, **Then** the latest records are fetched and displayed.

---

### User Story 3 - Records Sorted by Most Recent First (Priority: P3)

The dashboard table displays records in reverse chronological order so that the most recently submitted request appears at the top.

**Why this priority**: Operational convenience — staff typically need to act on the newest requests first.

**Independent Test**: Can be tested by inserting records with different timestamps and verifying the display order.

**Acceptance Scenarios**:

1. **Given** multiple records with different submission timestamps, **When** the dashboard loads, **Then** records are displayed with the most recent at the top.

---

### Edge Cases

- When the webhook fires but the call ended before all required fields were collected, the system silently discards the payload and returns HTTP 200 — no record is created.
- What if the same call ID is received twice (duplicate webhook delivery)?
- How does the dashboard handle a very large number of records (pagination or scroll)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a POST endpoint that accepts ElevenLabs post-call webhook payloads.
- **FR-002**: The POST endpoint MUST read the following fields from the structured JSON variables in the ElevenLabs webhook payload and persist them: user full name, contact info (phone and/or email), first available date/time, second available date/time, call timestamp, and call ID.
- **FR-003**: The POST endpoint MUST return a success response (HTTP 200) when the record is saved successfully.
- **FR-004**: The POST endpoint MUST return HTTP 200 and discard the webhook silently when any required fields are missing (call ended early). It MUST return HTTP 400 only when the payload is structurally malformed (not valid JSON or missing the envelope structure).
- **FR-005**: The system MUST deduplicate records by call ID — if a webhook with the same call ID is received more than once, it MUST NOT create a duplicate record.
- **FR-006**: The system MUST expose a GET endpoint that returns all removal request records, sorted by submission timestamp descending.
- **FR-007**: The GET endpoint MUST return records in a structured format consumable by the frontend.
- **FR-008**: The frontend MUST include a dashboard page accessible at a dedicated URL (e.g., `/requests`).
- **FR-009**: The dashboard page MUST display all removal request records in a table with columns: Name, Contact Info, First Available Slot, Second Available Slot, Request Date/Time.
- **FR-010**: The dashboard MUST show an empty-state message when no records exist.
- **FR-011**: The dashboard MUST follow the Intoxalock brand design system (color palette, typography, MUI components).

### Key Entities

- **RemovalRequest**: Represents a single completed call that resulted in a removal request. Key attributes: call ID (unique), user full name, contact info (phone and/or email), first availability slot (date + time), second availability slot (date + time), submission timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A POST webhook call with valid data results in a persisted record within 3 seconds.
- **SC-002**: The dashboard page loads and displays all records within 3 seconds under normal conditions.
- **SC-003**: 100% of completed calls with fully collected data appear in the dashboard with no missing fields.
- **SC-004**: Duplicate webhook deliveries for the same call ID result in exactly one record — no duplicates.
- **SC-005**: Operations staff can visually scan the dashboard and identify pending removal requests without any training.

## Clarifications

### Session 2026-06-10

- Q: How does ElevenLabs deliver collected data in the post-call webhook — structured variables or transcript text? → A: Structured variables — ElevenLabs delivers the agent's collected fields as named JSON variables in the webhook payload.
- Q: What should the system do when the webhook arrives but some fields were not collected (call ended early)? → A: Discard silently — ignore the webhook and return HTTP 200 with no record created.
- Q: Should the POST webhook endpoint verify requests come from ElevenLabs? → A: No auth — endpoint is open; acceptable for POC demo scope.
- Q: Should the dashboard auto-refresh data or only load on page load? → A: Manual only — data loads once on page load; user must refresh to see new records.

## Assumptions

- The ElevenLabs post-call webhook delivers a JSON payload that includes the agent's collected fields as named, structured JSON variables (not raw transcript). The specific variable names (e.g., `user_name`, `slot_1`, `contact_info`) will be mapped during planning against the ElevenLabs Data Collection configuration for this agent.
- The dashboard and the POST webhook endpoint are both unauthenticated for this POC — no request verification or login is required. This is acceptable given the demo-only scope.
- Pagination is out of scope for this POC; all records are loaded in a single request on page load. The dashboard does not auto-refresh — users must reload the page to see new records.
- The existing Lambda function and frontend project structure will be extended (not replaced) to add the new endpoints and page.
- Date/time slots collected by the voice agent are stored as plain text strings (as spoken by the user) since the agent does not enforce a strict date format.
- The service center is always "Car Toys" for this POC — it does not need to be stored per-record.
