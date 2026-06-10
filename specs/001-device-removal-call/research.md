# Research: Intoxalock Device Removal Call Automation

**Date**: 2026-06-10
**Feature**: 001-device-removal-call

---

## Decision 1: Phone Number Input Component

**Decision**: `mui-tel-input` library for the country selector + phone input field.

**Rationale**: Native MUI v6 integration, ships with flag icons, exposes the dial code and local number separately, and uses `libphonenumber-js` internally for validation. Eliminates the need to wire up a separate flag library.

**Alternatives considered**:
- `react-phone-input-2` — popular but not MUI-native; requires custom styling to match MUI theme.
- Manual implementation — too much effort for a POC; flag emoji + country list from scratch is ~200+ lines of boilerplate.

---

## Decision 2: Phone Number Validation

**Decision**: `libphonenumber-js` for E.164 formatting and per-country validation.

**Rationale**: Industry-standard library (Google libphonenumber port). Validates number length and format per country code. Used internally by `mui-tel-input`, so it's already a transitive dependency — no extra bundle cost.

**Alternatives considered**:
- Regex-only validation — too brittle; varies per country.
- Backend-only validation — poor UX; should fail fast on the frontend.

---

## Decision 3: Frontend Form Management

**Decision**: React Hook Form + Zod for schema validation.

**Rationale**: React Hook Form has minimal re-renders and integrates cleanly with MUI. Zod provides type-safe schema validation with clear error messages. Both are widely adopted in the React + TypeScript ecosystem.

**Alternatives considered**:
- Formik — heavier, slower than React Hook Form.
- Manual useState validation — repetitive and error-prone for multi-field forms.

---

## Decision 4: Infrastructure as Code

**Decision**: Terraform with a dedicated `infra/` directory at repo root.

**Rationale**: Terraform is the team's required IaC tool. The AWS provider is mature and well-documented for Lambda + API Gateway v2 + S3 + CloudFront. State can be stored in S3 backend for team collaboration. All resources declared as code, fully repeatable.

**Alternatives considered**:
- AWS SAM — purpose-built for Lambda but not Terraform; excluded per project requirement.
- AWS CDK — more setup overhead, not requested.
- Manual console deployment — not repeatable.

## Decision 4b: Frontend Hosting

**Decision**: S3 static website + CloudFront CDN.

**Rationale**: Optimal for a Vite-built React SPA. `npm run build` produces static assets synced to a private S3 bucket; CloudFront serves them globally with HTTPS. Both resources are first-class Terraform citizens (`aws_s3_bucket`, `aws_cloudfront_distribution`). Zero runtime cost for a POC, scales to production without changes.

**Alternatives considered**:
- AWS Amplify — good DX but less mature Terraform provider; adds lock-in for no benefit over S3+CF.
- ECS — overkill for static assets; requires a container running nginx + unnecessary cost.

---

## Decision 5: Backend HTTP Client (ElevenLabs API)

**Decision**: Native `fetch` (Node.js 18+).

**Rationale**: Node.js 18 (Lambda runtime `nodejs18.x`) ships with native `fetch`. No additional dependency needed for a single external API call.

**Alternatives considered**:
- `axios` — adds ~50KB to bundle for no benefit over native fetch in this scope.
- `node-fetch` — unnecessary on Node 18+.

---

## Decision 6: Backend Testing Framework

**Decision**: Jest + `ts-jest` for the Lambda backend.

**Rationale**: Jest is the standard for Node.js unit and integration testing. `ts-jest` provides TypeScript compilation without a separate build step. Integrates well with Lambda handler testing patterns.

**Alternatives considered**:
- Vitest — excellent for frontend; less conventional for Lambda/Node backends.
- Mocha + Chai — more config, less convention.

---

## Decision 7: Frontend Testing Framework

**Decision**: Vitest + React Testing Library.

**Rationale**: Vitest is the natural companion to Vite. React Testing Library enforces testing behavior (not implementation), aligned with the Test-First principle.

**Alternatives considered**:
- Jest + jsdom — works but requires more Vite-specific config shims.

---

## Decision 8: CORS Configuration

**Decision**: API Gateway CORS configured to allow the frontend origin. Lambda returns appropriate `Access-Control-Allow-Origin` headers.

**Rationale**: Frontend and backend are on different origins (Vite dev server vs. API Gateway URL). CORS must be explicitly enabled on the API Gateway resource.

---

## ElevenLabs API Reference (Outbound Call)

**Endpoint**: `POST https://api.elevenlabs.io/v1/convai/twilio/outbound-call`

**Headers**:
- `xi-api-key: <ELEVENLABS_API_KEY>` (required)
- `Content-Type: application/json`

**Request body**:
```json
{
  "agent_id": "<ELEVENLABS_AGENT_ID>",
  "agent_phone_number_id": "<ELEVENLABS_AGENT_PHONE_NUMBER_ID>",
  "to_number": "+15551234567"
}
```

**Success response** (`200 OK`):
```json
{
  "success": true,
  "message": "Call initiated",
  "conversation_id": "conv_abc123",
  "callSid": "CA1234567890abcdef"
}
```

**Error cases**:
- `401` — invalid or missing API key
- `422` — invalid `to_number` format or missing required field
- `429` — ElevenLabs rate limit exceeded
- `5xx` — ElevenLabs/Twilio internal error
