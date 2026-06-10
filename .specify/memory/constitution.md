<!--
SYNC IMPACT REPORT
==================
Version change: N/A → 1.0.0 (initial ratification)
Added sections:
  - Core Principles (I–VI)
  - Technology Stack
  - Development Workflow
  - Governance
Templates reviewed:
  - .specify/templates/plan-template.md      ✅ compatible
  - .specify/templates/spec-template.md      ✅ compatible
  - .specify/templates/tasks-template.md     ✅ compatible
Deferred TODOs: none
-->

# Intoxalock Device Removal POC — Constitution

## Core Principles

### I. Clean Architecture (NON-NEGOTIABLE)
The codebase MUST be organized in concentric layers: Domain → Application → Infrastructure → Presentation.
Dependencies point inward only; inner layers MUST NOT reference outer layers.
Each layer has a single, well-defined responsibility and is independently testable.

### II. Spec-Driven Development
Every feature MUST start with a written spec (`spec.md`) reviewed and clarified before any code is written.
Implementation MUST NOT begin until `/speckit-plan` and `/speckit-tasks` artifacts exist and pass `/speckit-analyze`.

### III. Test-First (NON-NEGOTIABLE)
Unit tests MUST be written before implementation (TDD: Red → Green → Refactor).
Integration tests MUST cover ElevenLabs API calls, Twilio outbound calls, and AWS Lambda handlers.
No feature is considered done without passing tests at unit and integration level.

### IV. API-First Backend
All backend logic MUST be exposed through versioned REST endpoints (`/api/v1/...`).
Lambda functions MUST be thin handlers that delegate to application-layer use cases.
External service integrations (ElevenLabs, Twilio) MUST be abstracted behind interfaces/ports.

### V. Security & Compliance
API keys and secrets MUST be stored in AWS Secrets Manager or environment variables — never hardcoded or committed.
All endpoints that trigger phone calls MUST validate inputs and authenticate requests.
PII (phone numbers, customer data) MUST be handled minimally and not logged in plaintext.

### VI. Simplicity & POC Scope
This is a Proof of Concept — YAGNI applies. Build only what demonstrates the core flow.
No premature abstractions. Three similar lines are better than a forced pattern.
UI MUST follow Intoxalock brand guidelines (color palette: #003366 primary, #0066CC accent, #FFFFFF/#F5F5F5 backgrounds).

## Technology Stack

**Frontend**: React + Vite, Material UI (MUI) v6+, TypeScript.
MUI theme MUST use Intoxalock palette: `primary.main = #003366`, `primary.dark = #002244`, `secondary.main = #0066CC`.

**Backend**: Node.js (TypeScript), AWS Lambda, API Gateway.
Architecture pattern: Clean Architecture with Use Cases, Domain entities, and Infrastructure adapters.

**External Services**:
- ElevenLabs Conversational AI — outbound call via `POST /v1/convai/twilio/outbound-call`
- Twilio — telephony layer managed by ElevenLabs integration

**Infrastructure**: AWS (Lambda + API Gateway v2 + S3 + CloudFront). IaC with **Terraform** (`infra/` directory at repo root).

**Language**: All code, comments, docs, and UI copy MUST be in English.

## Development Workflow

1. Feature request → `/speckit-specify`
2. Resolve ambiguities → `/speckit-clarify`
3. Plan design → `/speckit-plan`
4. Validate requirements → `/speckit-checklist`
5. Generate tasks → `/speckit-tasks`
6. Cross-artifact check → `/speckit-analyze`
7. Implement → `/speckit-implement`

Pull requests MUST reference the corresponding `spec.md` and `tasks.md` artifacts.
All code MUST pass linting (`eslint`) and type-checking (`tsc --noEmit`) before merge.

## Governance

This constitution supersedes all informal conventions.
Amendments require: (a) updated `spec.md` rationale, (b) version bump per semver rules, (c) team acknowledgment.
Compliance is verified at PR review time.
Any deviation from Clean Architecture layers or the no-hardcoded-secrets rule is a blocking issue.

**Version**: 1.0.1 | **Ratified**: 2026-06-10 | **Last Amended**: 2026-06-10
