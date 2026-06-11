# Quickstart & Validation Guide: Call Records Dashboard

**Date**: 2026-06-10

---

## Prerequisites

- AWS credentials configured (`aws configure` or env vars)
- Terraform >= 1.5 installed
- Node.js 18+ installed
- Backend and frontend dependencies installed (`npm install` in each)
- DynamoDB table deployed (see Infra section below)

---

## 1. Deploy Infrastructure

```bash
cd src/Infra
terraform init
terraform apply -var-file=terraform.tfvars
```

Note the outputs:
- `api_gateway_url` — base URL for the Lambda endpoints
- `frontend_url` — CloudFront URL for the frontend

---

## 2. Validate the Webhook Endpoint

### Happy path — all fields present

```bash
curl -X POST <api_gateway_url>/api/v1/webhook/call-completed \
  -H "Content-Type: application/json" \
  -d '{
    "type": "post_call_transcription",
    "event_timestamp": 1749600000,
    "data": {
      "conversation_id": "test-call-001",
      "agent_id": "agent_test",
      "status": "done",
      "data_collection_results": {
        "user_name":    { "value": "Jane Smith" },
        "contact_info": { "value": "+15551234567" },
        "slot_1":       { "value": "Tuesday June 17 at 2pm" },
        "slot_2":       { "value": "Wednesday June 18 at 10am" }
      }
    }
  }'
```
**Expected**: `{"message":"ok"}` with HTTP 200. Record appears in DynamoDB.

### Incomplete call — missing slot_2

```bash
curl -X POST <api_gateway_url>/api/v1/webhook/call-completed \
  -H "Content-Type: application/json" \
  -d '{
    "type": "post_call_transcription",
    "event_timestamp": 1749600000,
    "data": {
      "conversation_id": "test-call-002",
      "data_collection_results": {
        "user_name": { "value": "John Doe" },
        "contact_info": { "value": "john@example.com" }
      }
    }
  }'
```
**Expected**: `{"message":"ok"}` with HTTP 200. NO record written to DynamoDB.

### Duplicate call ID

Send the happy-path request a second time with the same `conversation_id`. **Expected**: HTTP 200, only one record in DynamoDB (upsert, no duplicate).

### Malformed JSON

```bash
curl -X POST <api_gateway_url>/api/v1/webhook/call-completed \
  -H "Content-Type: application/json" \
  -d 'not json'
```
**Expected**: HTTP 400 `{"error":"Invalid payload","code":"VALIDATION_ERROR"}`.

---

## 3. Validate the GET Endpoint

```bash
curl <api_gateway_url>/api/v1/removal-requests
```
**Expected**: `{"records":[...]}` containing the record from step 2. Most recent record is first.

---

## 4. Validate the Frontend Dashboard

1. Open `<frontend_url>/requests` in a browser.
2. **Expected**: Table with columns Name, Contact Info, First Available Slot, Second Available Slot, Request Date/Time.
3. Row for "Jane Smith" should appear with all fields populated.
4. Remove all records from DynamoDB and refresh — **expected**: empty-state message shown.

---

## 5. Run Unit Tests

```bash
# Backend
cd src/backend
npm test

# Frontend
cd src/frontend
npm test
```
All tests must pass before deployment.

---

## References

- Data model: [data-model.md](./data-model.md)
- API contracts: [contracts/api.md](./contracts/api.md)
- Spec: [spec.md](./spec.md)
