# AWS Architecture — Intoxalock Device Removal Scheduling Automation

*Client: Mindr (brand: Intoxalock) · Prepared 2026-06-09 · Status: draft for review*
*Companion docs: [Solution Design](./Solution-Design.md) ·
[Problem Definition](../base-documents/Problem-Definition.md) ·
[ADR-0003 Step Functions orchestration](../docs/adr/0003-step-functions-orchestration.md) ·
[ADR-0004 DynamoDB for all stores](../docs/adr/0004-dynamodb-for-all-stores.md) ·
Diagram: [AWS-Architecture-Diagram.drawio](./AWS-Architecture-Diagram.drawio)*

---

## 1. Shape of the problem → shape of the architecture

Two facts dominate every choice:

1. **A Removal Request is a long-running, timer-driven workflow** — it waits *days*
   on a Service Center or a customer to act, runs lead-time-aware escalation rungs,
   fires ~24h/~12h reminders, and must guarantee **every branch terminates**
   (Solution Design §2.3).
2. **Volume is ~100 requests/month (~3–4/day).** There is no throughput problem at
   all; cost is dominated by *idle* charges, not work done.

Therefore: **serverless, zero-idle, pay-per-use throughout.** No EC2, no ECS, no
ALB, no NAT Gateway, no relational database — each of those carries a fixed monthly
floor ($16–32/mo each) that alone exceeds the cost of the entire serverless stack.
The engineering effort goes into correctness, compliance, and timers — not scale.

---

## 2. Architecture at a glance

| Concern | Service | Role |
|---|---|---|
| Orchestration spine | **Step Functions (Standard)** | 1 execution = 1 Removal Request; all waits, timers, escalation, retry/catch; execution history doubles as the compliance audit trail (ADR-0003) |
| Compute | **Lambda** | 4 consolidated functions: `send-message` (every outbound message: consent check → template → audit log), `escalate-to-rep`, `generate-work-order`, `intake-handler` (API-side, pre-execution) |
| State & data | **DynamoDB** (on-demand) | Requests · Consent Records · Operating-Hours cache · per-message audit log (ADR-0004) |
| Web surfaces | **S3 + CloudFront** | Static SPA: intake form (app/SMS-link channel) + Confirmation Page |
| API front door | **API Gateway (HTTP API)** | Single entry for form submissions, Confirmation Page actions, inbound webhooks, voice callbacks |
| Email | **SES** | Acknowledgments, center links, reminders, warnings (transactional) |
| SMS | **End User Messaging** (10DLC) | Two-way SMS; managed STOP/HELP; inbound via SNS → Lambda |
| Inbound SMS fan-in | **SNS** | Delivers inbound SMS to the keyword-handler Lambda |
| Voice agent | **— black box —** | Deferred decision: Amazon Connect + Lex vs. voice-AI SaaS (see §6) |
| Work-Order issuance | **— black box —** | Deferred pending client answer on the system-of-record API (Solution Design §8.5) |
| App push | **Intoxalock's app backend** | Integration point, not ours to build (client dependency) |
| Rep surface | **Ticketing system API** (Zendesk?) | Escalations as tickets with full history; **no custom rep UI in v1** |
| Hours lookup | **Google Places API** | Lazy, per-assigned-center, at intake; cached with TTL |
| Secrets | **SSM Parameter Store** (SecureString) | HMAC signing key, Places key, ticketing token — free tier, no rotation needed in v1 |
| Observability | **CloudWatch** | Alarms on Fail states, DLQs, outbound-send errors → SNS → ops email/Slack |
| Region / IaC | **us-east-1** / **Terraform** | All-US customer base; team convention |

---

## 3. The spine — Step Functions Standard (ADR-0003)

One Standard execution per Removal Request maps the Solution Design almost 1:1:

- **Eligibility Gate** → `Choice` state (ineligible → human branch). Range/lead-time
  validation happens in the API `intake-handler` **before** `StartExecution` — the
  form gets instant feedback and invalid requests never become executions.
- **Confirmation Ladder (§5.2)** → `waitForTaskToken` races a lead-time-aware
  timeout: center actions the page **or** the timer advances the rung
  (link → follow-up → AI voice → human). Task tokens are stored on the request item
  via the **direct `dynamodb:putItem.waitForTaskToken` integration** — the wait
  states need no Lambda.
- **Processing Reminder (~24h)** → chunked wait, not a parallel branch: the center
  wait is sliced into ≤24h segments (`TimeoutSecondsPath` = min(24h, time to the rung
  deadline)); each caught `States.Timeout` sends the reminder and re-arms. Resolution
  exits the loop, so an orphaned reminder timer is unrepresentable.
- **Work-Order gate (§5.3)** → task state with `Retry`/`Catch`; failure routes to
  human escalation, customer is never told "confirmed" (ADR-0002 invariant).
- **Decline → counter-offer (§5.4)** → held-TTL `Wait` + nudges, terminating.
- **Phase 3 (§6)** → `Wait` until T-12h, then `Choice`: Appointment Reminder vs.
  Non-Confirmation Warning.

Lambdas do every actual action; Step Functions owns state-between-wake-ups, all
timers, external-event resume (task tokens), and failure routing — which is what
makes "every branch terminates" true in the engine, not just the document.
Every message-sending state invokes the **same `send-message` function** with a
template ID — one code path for the consent check, quiet-hours shift, and
per-message audit-log write that TCPA requires on every outbound message; the
work-order function stays separate for IAM scoping and alarm isolation.
**No EventBridge Scheduler**: `Wait` states cover per-request timers, and the lazy
hours strategy (§7) eliminated the only background cron.

Step Functions is the orchestrator, **not** the system of record: request state is
mirrored in DynamoDB so "all open requests for center X" is a query, not an
execution crawl.

## 4. Data — DynamoDB only (ADR-0004)

Four tables, on-demand mode, every access pattern a key lookup or single GSI query:

- **Requests** — status, ranges, pinned time, quote (embedded attribute),
  escalation history; GSIs by status and by center. Single-use link enforcement =
  conditional write on the request item.
- **Consent Records** — per-contact, per-channel, timestamped, revocable; checked
  before *every* outbound message; updated on STOP. PITR enabled; Streams → S3
  export available if counsel requires immutable history.
- **Operating-Hours cache** — per center, TTL-stamped (§7).
- **Message audit log** — every outbound message, channel, consent basis (TCPA
  disputes are per-message; the execution history alone is not message-granular).

## 5. Channels

- **Email — SES.** Transactional only; no marketing content (keeps CAN-SPAM
  exempt status and TCPA consent at the lower informational tier).
- **SMS — End User Messaging**, A2P 10DLC registered in-console (brand =
  Intoxalock's EIN — client cooperation required; campaign review can take 1–3
  weeks → **start registration early**, it is the longest external lead time).
  Managed STOP/HELP at carrier level, mirrored into Consent Records via the
  inbound webhook.
- **SMS policy (resolved during review): outbound is templated-only — no
  generative copy.** Counsel approves every string once; the "confirmed"-word
  discipline (§2.6, FTC §5) is enforceable with templates and not with an LLM
  composing messages. Inbound SMS is **keyword-level only**: STOP/HELP and
  digit-replies for binary decisions (e.g. counter-offer "Reply 1 to accept Thu
  3pm") → Lambda → `SendTaskSuccess`. Anything structured goes to the signed form
  link — the form makes invalid input impossible by construction (root cause #4),
  which a conversation can only correct after the fact.
- **App push** — via Intoxalock's existing app backend; integration point to
  confirm with the client.

## 6. The two black boxes (deliberately deferred)

Both sit behind the same seam pattern: *a Lambda hands context to the box; the
outcome returns via callback → `SendTaskSuccess`*. Nothing in the spine changes
when a box's implementation is chosen or swapped.

1. **AI Voice Agent** (ladder rung 3; v1 scope = outbound-to-centers only).
   Candidates: **Amazon Connect + Lex** (in-account — no third-party data
   processor for a DUI-adjacent dataset, pay-per-minute, but slot-filling-grade
   conversation) vs. **voice-AI SaaS / Twilio ConversationRelay** (better
   conversational quality, new vendor + DPA). The ladder already terminates in a
   human, so the bot only needs to resolve the easy calls and fail cleanly
   downward — measure the rung's resolution rate from day one and decide on data.
   **Inbound (customer calls, AI answers):** whether AI fronts the existing 888
   line is a client question (their telephony and reps). When it does, the same
   black box answers with AI-disclosure up front, runs the §4 intake conversation
   (eligibility, vehicle, two time ranges), drops to a human rep on any
   complexity or on request, and posts the captured request to the same
   `/intake` endpoint — the pipeline is channel-agnostic and never knows the
   request arrived by phone.
2. **Work-Order issuance** (the gate of ADR-0002). Deferred pending the client's
   answer on the system-of-record integration (Solution Design §8.5).

## 7. Web surfaces & signed links

- **S3 + CloudFront** serve the static SPA (intake form + Confirmation Page);
  CloudFront adds TLS on a custom domain and WAF attachment at ~$0.
- **API Gateway (HTTP API)** is the single front door for *all* inbound events —
  form posts, page actions, SMS webhooks, voice callbacks — one auth/logging/WAF
  surface, every handler resolving a task token where applicable.
- **Confirmation Page links**: HMAC-signed token (request ID + expiry; key in
  Parameter Store), verified in Lambda; **single-use enforced by a DynamoDB
  conditional write** (two clicks cannot both succeed). No login system in v1.
- **Operating Hours**: fetched **lazily at intake** for the assigned center from
  Google Places API on cache miss/stale TTL (~300–500ms inside form load),
  cached; default business-hours fallback on failure. All 5000+ centers are
  coverable — only the ~100/month actually hit are ever looked up (lazy ≈ $2/mo
  vs. ~$85/mo for bulk refresh). Centers confirm/correct hours via a widget on
  the Confirmation Page. No scraping (ToS liability).
- **Rep surface**: escalation = ticket in the client's ticketing system via API,
  with full interaction history and reminder bumps. A custom rep UI is the
  largest avoidable piece of v1 frontend work; a ticket *is* "tracked with
  reminders."

## 8. Cross-cutting

- **Region**: us-east-1 (all-US customers; simplest SES/SMS origination).
- **Secrets**: SSM Parameter Store SecureString (free; nothing needs managed
  rotation in v1 — revisit if that changes).
- **Observability**: CloudWatch alarms on (a) any execution reaching a Fail
  state, (b) any DLQ message, (c) outbound-message Lambda errors — a silently
  failed reminder is exactly the "silently dropped request" this system exists to
  prevent. Alerts via SNS to email/Slack.
- **IaC**: **Terraform** (team convention). Note: the state-machine definition
  lives as an ASL JSON document referenced from HCL.
- **State-machine deploys**: in-flight executions keep the definition they started
  with; with days-to-weeks executions, every deploy coexists with old-version
  executions — keep changes backward-compatible at task boundaries or include a
  drain plan (ADR-0003).

## 9. Estimated monthly cost (us-east-1, ~100 requests/mo)

| Item | Est. |
|---|---|
| Step Functions (~3k transitions) | < $0.10 |
| Lambda (within perpetual free tier) | ~$0 |
| DynamoDB on-demand (≪ free tier) | ~$0 |
| API Gateway + S3 + CloudFront | < $2 |
| SES | < $1 |
| SMS: 10DLC campaign $10 + number ~$1 + ~1.5k msgs ~$12 | **~$23** |
| Google Places (lazy, ~100 lookups) | ~$0–2 |
| Voice minutes (~100–300 min, either box) | ~$5–45 |
| CloudWatch | ~$1–3 |
| **Total** | **~$30–75/mo** — dominated by SMS fixed fees and voice minutes; the compute/storage/orchestration core is effectively free |

## 10. Open dependencies on the client (architecture-relevant)

1. Work-Order integration point into the system of record (§8.5) → fills black box 2.
2. Inbound 888 number: does AI ever front it; how do transfers work? → scopes black box 1.
3. App-push integration into the existing mobile app backend.
4. Ticketing system in use (Zendesk?) + API access for rep escalations.
5. 10DLC brand registration under Intoxalock's EIN (start early; 1–3 weeks).
6. Existing hours data to seed the Operating-Hours cache (§8.7).
