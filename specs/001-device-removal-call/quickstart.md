# Quickstart & Validation Guide

**Feature**: Intoxalock Device Removal Call Automation
**Date**: 2026-06-10

---

## Prerequisites

- Node.js 18+ and npm
- Terraform 1.6+ (`terraform --version`)
- AWS CLI configured with a profile that has Lambda + API Gateway + S3 + CloudFront permissions
- An ElevenLabs account with:
  - A Conversational AI agent configured for device removal calls
  - A Twilio phone number linked to the agent
  - An API key

---

## Environment Setup

### Infrastructure — create `infra/terraform.tfvars` (never commit)

```hcl
elevenlabs_api_key              = "your_api_key_here"
elevenlabs_agent_id             = "your_agent_id_here"
elevenlabs_agent_phone_number_id = "your_phone_number_id_here"
aws_region                      = "us-east-1"
```

### Frontend — create `frontend/.env.local` (never commit)

```bash
# Local development — point to deployed API Gateway URL
VITE_API_BASE_URL=https://<api-gateway-id>.execute-api.<region>.amazonaws.com
```

> **Note**: There is no local API Gateway emulator. For local frontend development, deploy the backend to AWS first and use the real API Gateway URL, or mock the API client in development.

---

## Running Locally

### 1. Build and deploy backend infrastructure (first time)

```bash
cd infra
terraform init
terraform apply -var-file="terraform.tfvars"
```

Copy the `api_gateway_url` output value — this is your `VITE_API_BASE_URL`.

### 2. Deploy Lambda code

```bash
cd backend
npm install
npm run build        # compiles TypeScript to dist/
cd ..
# Package and update Lambda function code:
zip -r lambda.zip backend/dist backend/node_modules
aws lambda update-function-code \
  --function-name intoxalock-call-request \
  --zip-file fileb://lambda.zip
```

### 3. Start the frontend (Vite dev server)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Ensure `VITE_API_BASE_URL` in `frontend/.env.development.local` points to the deployed API Gateway URL (already set to `http://localhost:3000` for local mock use).

---

## Validation Scenarios

### Scenario 1 — Happy path (P1 core flow)

1. Open `http://localhost:3000`
2. Verify the form shows: "Full Name" field, country selector (default US 🇺🇸 +1), phone number field, TCPA consent checkbox, and a disabled Submit button
3. Enter a valid full name (e.g., "Jane Smith")
4. Enter a valid US number in the phone field (e.g., `5551234567`)
5. Check the TCPA consent checkbox
6. Submit button becomes enabled — click it
7. ✅ **Expected**: Loading state shown, then confirmation screen appears with a `conversation_id`, and the message "Your request has been received. An AI Agent will contact you shortly."
8. ✅ **Expected**: A phone call is placed to the number entered

### Scenario 2 — Form validation (P2)

1. Open the form
2. Click Submit without filling any fields
3. ✅ **Expected**: Inline error messages on "Full Name" and phone number fields; form not submitted
4. Enter a name but leave the phone number blank; click Submit
5. ✅ **Expected**: Only the phone number error remains
6. Enter an invalid phone number (e.g., `123`); move focus away
7. ✅ **Expected**: Inline error "Please enter a valid phone number"
8. Leave TCPA checkbox unchecked with all other fields valid
9. ✅ **Expected**: Submit button remains disabled

### Scenario 3 — Country selector

1. Click the country selector flag
2. Select a different country (e.g., Mexico 🇲🇽)
3. ✅ **Expected**: Dial code updates to `+52`
4. Enter a valid Mexican mobile number
5. ✅ **Expected**: Validation passes; E.164 number sent to backend uses `+52` prefix

### Scenario 4 — Error + one-click retry

1. Temporarily update the `ELEVENLABS_API_KEY` Lambda env var to an invalid value:
   ```bash
   aws lambda update-function-configuration \
     --function-name intoxalock-call-request \
     --environment "Variables={ELEVENLABS_API_KEY=invalid,...}"
   ```
2. Submit a valid form
3. ✅ **Expected**: Error screen shown with a "Try Again" button
4. Restore the correct API key and click "Try Again"
5. ✅ **Expected**: Same form data re-submitted automatically; confirmation screen appears

### Scenario 5 — Duplicate submission prevention

1. Fill the form with valid data
2. Click Submit rapidly multiple times
3. ✅ **Expected**: Button is disabled after first click; only one API call is made

---

## Running Tests

### Backend unit + integration tests

```bash
cd backend
npm test
```

Key test suites:
- `InitiateRemovalCallUseCase` — unit tests with mocked `ICallService` port
- `ElevenLabsCallService` — integration test (mocks `fetch` via `jest.spyOn`)
- `callRequestHandler` — integration test with mock API Gateway v2 proxy events (valid payload → 200, invalid → 400, service error → 502)

### Frontend tests

```bash
cd frontend
npm test
```

Key test suites:
- `RequestForm` — renders, validates, disables submit, shows errors
- `ConfirmationScreen` — renders `conversationId` and static message
- `submitRemovalRequest` use case — unit test with mocked API client

---

## Deploying to AWS

### Full deploy (first time)

```bash
# 1. Provision infrastructure
cd infra
terraform init
terraform apply -var-file="terraform.tfvars"

# 2. Build and deploy Lambda
cd ../backend
npm run build
cd ..
zip -r lambda.zip backend/dist backend/node_modules
aws lambda update-function-code \
  --function-name intoxalock-call-request \
  --zip-file fileb://lambda.zip

# 3. Build and deploy frontend
cd frontend
VITE_API_BASE_URL=<terraform output api_gateway_url> npm run build
aws s3 sync dist/ s3://$(cd ../infra && terraform output -raw frontend_bucket_name) --delete
aws cloudfront create-invalidation \
  --distribution-id $(cd ../infra && terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

### Subsequent Lambda-only deploys

```bash
cd backend && npm run build && cd ..
zip -r lambda.zip backend/dist backend/node_modules
aws lambda update-function-code \
  --function-name intoxalock-call-request \
  --zip-file fileb://lambda.zip
```

### Terraform outputs reference

| Output | Description |
|--------|-------------|
| `api_gateway_url` | API Gateway base URL — use as `VITE_API_BASE_URL` |
| `frontend_bucket_name` | S3 bucket name for frontend assets |
| `cloudfront_distribution_id` | CloudFront distribution ID for cache invalidation |
| `cloudfront_domain` | Public CloudFront URL for the frontend |
