# Quickstart & Validation Guide: Call Records Dashboard

**Date**: 2026-06-11 (revised)

---

## Prerequisites

- AWS credentials configured with `AWS_PROFILE=sm`
- Terraform >= 1.5 installed
- Node.js 18+ installed
- Backend and frontend dependencies installed (`npm install` in each)
- ElevenLabs agent configured (see Manual Setup below)

---

## Manual ElevenLabs Agent Setup (one-time)

Before end-to-end testing, configure the ElevenLabs agent in the dashboard:

1. **System prompt**: Paste the content from `specs/002-call-records-dashboard/agent-prompt.md`
2. **Data Collection variables** (add all three):
   - `confirmed_slot` (string)
   - `shop_suggested_slot_1` (string)
   - `shop_suggested_slot_2` (string)
3. **Webhook URL**: Set to `<api_gateway_url>/api/v1/webhook/call-completed` after deploy
4. Verify `agent_id` in `terraform.tfvars` matches the configured agent

---

## 1. Deploy Infrastructure

```bash
cd src/backend && npm run build
cd ../Infra
AWS_PROFILE=sm terraform init
AWS_PROFILE=sm terraform apply -var-file=terraform.tfvars
```

Note the outputs:
- `api_gateway_url` — base URL for the Lambda endpoints
- `frontend_url` — CloudFront URL for the frontend

---

## 2. Validate the Call Request Endpoint (POST)

```bash
curl -X POST <api_gateway_url>/api/v1/call-request \
  -H "Content-Type: application/json" \
  -d '{
    "shopPhone": "+12065550100",
    "customerSlots": [
      "October 10th 2026 at 10:00am",
      "October 11th 2026 at 2:00pm"
    ],
    "submittedAt": "2026-06-11T14:00:00.000Z"
  }'
```
**Expected**: `{"conversationId":"conv_...","callSid":"CA_...","message":"Call initiated successfully"}` with HTTP 200. An `in_progress` record appears in DynamoDB.

---

## 3. Validate the Webhook Endpoint (POST)

### Confirmed slot

```bash
curl -X POST <api_gateway_url>/api/v1/webhook/call-completed \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "conversation_id": "test-conv-001",
      "data_collection_results": {
        "confirmed_slot":        { "value": "October 10th 2026 at 10:00am" },
        "shop_suggested_slot_1": { "value": "" },
        "shop_suggested_slot_2": { "value": "" }
      }
    }
  }'
```
**Expected**: HTTP 200 `{"message":"ok"}`. DynamoDB record has `status=confirmed`.

### Needs recontact (shop rejects all customer slots)

```bash
curl -X POST <api_gateway_url>/api/v1/webhook/call-completed \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "conversation_id": "test-conv-002",
      "data_collection_results": {
        "confirmed_slot":        { "value": "" },
        "shop_suggested_slot_1": { "value": "October 12th 2026 at 8:00am" },
        "shop_suggested_slot_2": { "value": "October 15th 2026 at 11:00am" }
      }
    }
  }'
```
**Expected**: HTTP 200 `{"message":"ok"}`. DynamoDB record has `status=needs_recontact`.

### Failed call

```bash
curl -X POST <api_gateway_url>/api/v1/webhook/call-completed \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "conversation_id": "test-conv-003",
      "data_collection_results": {
        "confirmed_slot":        { "value": "" },
        "shop_suggested_slot_1": { "value": "" },
        "shop_suggested_slot_2": { "value": "" }
      }
    }
  }'
```
**Expected**: HTTP 200 `{"message":"ok"}`. DynamoDB record has `status=failed`.

### Malformed JSON → 400

```bash
curl -X POST <api_gateway_url>/api/v1/webhook/call-completed \
  -H "Content-Type: application/json" -d 'not json'
```
**Expected**: HTTP 400 `{"error":"...","code":"VALIDATION_ERROR"}`.

### Missing conversation_id → 400

```bash
curl -X POST <api_gateway_url>/api/v1/webhook/call-completed \
  -H "Content-Type: application/json" \
  -d '{"data":{"data_collection_results":{}}}'
```
**Expected**: HTTP 400 `{"error":"...","code":"VALIDATION_ERROR"}`.

---

## 4. Validate the GET Endpoint

```bash
curl <api_gateway_url>/api/v1/removal-requests
```
**Expected**: `{"records":[...]}` sorted by `submittedAt` descending. Contains records from steps 2 and 3.

---

## 5. Validate the Frontend

1. Open `<frontend_url>/` — submit the "Simulate Pending Call" form with shop phone and 2 slots.
2. Verify success chip with `conversationId` appears.
3. Click "Call Records" nav link → `/requests`.
4. Verify table shows records with color-coded status badges:
   - Grey: In Progress
   - Green: Confirmed
   - Orange: Needs Recontact
   - Red: Failed
5. Refresh page — records reload (manual refresh only, no auto-polling).

---

## 6. Run Tests

```bash
# Backend (unit tests — integration requires local DynamoDB)
cd src/backend && npm test

# Frontend
cd src/frontend && npm test
```

All unit tests must pass before deployment.
