# Feature Specification: Intoxalock Device Removal Call Automation

**Feature Branch**: `001-device-removal-call`

**Created**: 2026-06-10

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Submit Device Removal Request (Priority: P1)

A customer who needs to uninstall their Intoxalock interlock device visits the web portal, fills out a short form with their contact and device information, and submits a request. The system initiates an AI-powered phone call to the customer to confirm and process the removal request.

**Why this priority**: This is the entire core value of the POC. Without this flow nothing else matters.

**Independent Test**: Can be fully tested by submitting the form with valid data and verifying that a phone call is triggered and a confirmation screen is shown with a call reference ID.

**Acceptance Scenarios**:

1. **Given** a customer on the request form page, **When** they enter a valid name and select a country + enter a local phone number, **Then** the frontend assembles the full E.164 number, initiates an outbound AI call to that number, and displays a confirmation screen with a call reference ID.
2. **Given** an active call is triggered, **When** the customer answers, **Then** the ElevenLabs AI agent confirms the removal request details with the customer.
3. **Given** a customer submits the form, **When** the backend receives the request, **Then** a unique `conversation_id` and `callSid` are returned and shown on the confirmation screen.

---

### User Story 2 — Form Validation & Error Feedback (Priority: P2)

A customer attempts to submit the removal request form with missing or invalid data. The system prevents submission and clearly communicates what needs to be corrected.

**Why this priority**: Invalid submissions would cause failed API calls or bad call attempts. Validation protects the user experience and backend reliability.

**Independent Test**: Can be tested independently by submitting the form with missing required fields and verifying that helpful inline error messages appear without triggering any backend call.

**Acceptance Scenarios**:

1. **Given** the form is submitted with an empty required field, **When** validation runs, **Then** the field is highlighted with a clear error message and the form is not submitted.
2. **Given** an invalid phone number format is entered for the selected country, **When** the user moves focus away or submits, **Then** an inline error message asks for a valid phone number for the selected country.

---

### User Story 3 — Call Confirmation Screen (Priority: P3)

After successfully submitting a request, the customer sees a confirmation screen that reassures them the call has been initiated and provides reference information.

**Why this priority**: Builds trust and reduces repeat submissions. The customer needs confirmation that something is happening.

**Independent Test**: Can be tested by mocking a successful API response and verifying the confirmation screen renders with the correct reference IDs.

**Acceptance Scenarios**:

1. **Given** a successful call initiation, **When** the confirmation screen loads, **Then** it displays the `conversation_id` and a static message: "Your request has been received. An AI Agent will contact you shortly."
2. **Given** the customer is on the confirmation screen, **When** they want to submit another request, **Then** a "Submit Another Request" action is available.

---

### Edge Cases

- What happens when the ElevenLabs/Twilio call fails (network error, invalid phone number, rate limit)? → Show a user-friendly error message and allow retry.
- What happens if the customer submits the form twice rapidly? → The submit button is disabled after first click to prevent duplicate calls.
- What if the phone number provided is not reachable or goes to voicemail? → The AI agent handles this per ElevenLabs agent configuration; the frontend still shows the confirmation screen.
- What if the backend Lambda times out? → A timeout error message is shown with instructions to try again or contact support.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a web form for customers to submit a device removal request with exactly two fields: full name (required) and phone number (required), plus a mandatory TCPA consent checkbox.
- **FR-002**: The phone number field MUST be composed of two parts: (a) a country selector showing the country flag and dial code prefix, defaulting to the United States (+1), and (b) a text input for the local phone number digits. The frontend MUST concatenate the dial code and local number into a single E.164-formatted value before sending to the backend.
- **FR-003**: The system MUST validate that both fields are completed and that the resulting phone number is valid for the selected country before allowing form submission.
- **FR-003a**: The form MUST include a required TCPA consent checkbox with a link to Terms & Conditions. The checkbox text MUST state that the customer agrees to receive automated phone calls regarding their Intoxalock device removal request, in compliance with the Telephone Consumer Protection Act (TCPA). The form MUST NOT be submittable unless the checkbox is checked.
- **FR-004**: Upon valid form submission, the system MUST initiate an outbound AI-powered phone call to the E.164 phone number assembled from the country dial code and local number entered by the customer.
- **FR-005**: The system MUST display a static confirmation screen after a successful call initiation. The screen MUST show the call reference identifier (`conversation_id`) and a message informing the customer that an AI Agent will contact them shortly. No real-time call status polling or webhooks are required.
- **FR-006**: The system MUST display a user-friendly error message if the call cannot be initiated, with a one-click retry button that automatically re-submits the same data without requiring the customer to re-enter any information.
- **FR-007**: The system MUST disable the submit button after the first submission attempt to prevent duplicate calls.
- **FR-008**: All user-facing copy and labels MUST be in English.
- **FR-009**: The web interface MUST follow Intoxalock brand guidelines (color palette, typography, and visual style).
- **FR-010**: API keys and credentials MUST NOT be exposed to the client or hardcoded in source code.
- **FR-011**: The Lambda MUST read the following configuration from environment variables at runtime: `ELEVENLABS_API_KEY` (required to authenticate every ElevenLabs API request via the `xi-api-key` header), `ELEVENLABS_AGENT_ID`, and `ELEVENLABS_AGENT_PHONE_NUMBER_ID`. These values MUST be set at deploy time and never committed to source control.

### Key Entities

- **RemovalRequest**: Represents a customer's request to uninstall their device. Attributes: full name, full phone number (E.164 format assembled from country code + local number), submission timestamp.
- **CallRecord**: Represents the outcome of a triggered outbound call. Attributes: `conversation_id`, `callSid`, status, timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can complete and submit the removal request form in under 2 minutes.
- **SC-002**: An outbound call is initiated within 5 seconds of a valid form submission.
- **SC-003**: 100% of valid submissions receive a confirmation screen with a call reference ID (no silent failures).
- **SC-004**: Form validation prevents 100% of submissions with missing required fields from reaching the backend.
- **SC-005**: The confirmation screen loads within 3 seconds of a successful call initiation response.

## Clarifications

### Session 2026-06-10

- Q: Should the form include explicit TCPA consent before triggering an automated call? → A: Yes — required consent checkbox with Terms & Conditions adapted to US law (TCPA), explicitly stating the customer agrees to receive automated calls regarding their device removal request.
- Q: Should the confirmation screen show live/real-time call status or a static message? → A: Static confirmation — shows `conversation_id` and a message that an AI Agent will contact the customer shortly. No polling or webhooks required.
- Q: On call failure, should retry return to the pre-filled form or re-submit automatically? → A: One-click retry — re-submits the same data automatically, no re-entry required.
- Q: Should the API enforce rate limiting to prevent abuse? → A: No — rate limiting is out of scope for this controlled POC demo.
- Q: How should the Lambda access ElevenLabs configuration (agent_id, phone number ID, API key)? → A: Lambda environment variables set at deploy time — `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_AGENT_PHONE_NUMBER_ID`. Never committed to source control.

## Assumptions

- The country selector defaults to United States (+1) but supports other countries to accommodate edge cases.
- The frontend is responsible for concatenating the country dial code and local number into E.164 format before sending to the backend.
- The ElevenLabs agent (`agent_id`), Twilio phone number (`agent_phone_number_id`), and API key are pre-configured and provided as Lambda environment variables before the POC runs.
- This is a POC — no authentication or login is required for the submission form.
- Mobile responsiveness is desirable but not a hard requirement for the POC.
- The ElevenLabs AI agent script/conversation flow for the removal confirmation call is configured separately in the ElevenLabs platform, not within this codebase.
- A single AWS region deployment is sufficient for the POC.
- No persistent database is required for the POC; call records are tracked via ElevenLabs/Twilio and the `conversation_id` returned to the user.
- Rate limiting and abuse prevention are out of scope for this POC; the demo is used in a controlled environment.
