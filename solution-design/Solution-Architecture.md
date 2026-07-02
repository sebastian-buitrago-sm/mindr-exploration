# Solution Architecture — Intoxalock Device Removal Scheduling

*Client: Mindr (brand: Intoxalock) · Prepared 2026-07-01 · Event-driven orchestration on AWS*
*Companion diagram: `solution-design/Solution-proposal-diagrams.drawio` → **AWS architecture diagram** page*

> This is the **current, refined solution**. It supersedes any earlier proposal in this repo.

---

## 1. Executive summary

The core problem (see `base-documents/Problem-Definition.md`) is that scheduling a
device removal is a **manual, phone-based coordination process** between Intoxalock
representatives and independent service centers that have **no availability data and
no scheduling API**. Requests are slow to confirm, silently dropped when a center
doesn't answer, and routinely mistaken by customers for real appointments.

The solution replaces the manual coordination with a **single long-running,
event-driven orchestration** built on **AWS Step Functions (Standard Workflow)**.
Each removal request becomes **one workflow execution** that:

1. **waits** until the target service center is open,
2. **calls the center** with an AI voice agent (ElevenLabs + Twilio) to confirm the
   appointment and capture the vehicle-based quote,
3. **calls the customer back** (voice) only if the center offered alternative slots,
4. **issues the work order** and confirms the customer, then
5. **escalates to a human** with full history whenever the automated path can't
   safely resolve the booking.

The design turns an ambiguous, drop-prone request into a **reliably-confirmed
appointment backed by a valid work order** — the explicit project goal.

---

## 2. The workflow, stage by stage

One execution = one Removal Request. Stages are visual groups inside a **single**
state machine.

### Pre-execution — Request Intake (Intoxalock backend + API Gateway + `api-handler` Lambda)
Before the workflow starts, the Intoxalock backend already:
- checks **eligibility** (only automatable, paperwork-free requests are sent through), and
- sends the customer the "request received" acknowledgment.

The request is posted to **API Gateway → `api-handler` Lambda**, which validates it,
computes the **time-zone-aware "center-open" target**, creates the **Removal Requests**
record, and starts the state machine. This means the workflow only ever handles
**eligible, well-formed** requests, and never has to reason about intake validation
or business-hours math at runtime.

### Stage 1 — Wait Until Center Open
A **Wait** state (using the timestamp computed at intake) holds the execution until the
center's working hours. This directly fixes intake breakpoint #1 (impractical times,
closed centers): the workflow simply **sleeps** — at zero compute cost — until it is
actually useful to call.

### Stage 2 — Center Confirmation (voice-first)
- **Enough Time to Confirm?** — a lead-time guard; if it's too late to still make the
  appointment window, escalate.
- **Place Outbound Call** — invokes the reusable **Outbound Call Service** (below) with
  the **center agent** and the vehicle/slot payload. The AI agent confirms the
  appointment and captures the **quote** (informational, never a gate).
- **Center Response?** —
  - `CONFIRMED` → skip straight to Work Order,
  - `DECLINED + alternative slots` → Customer Callback,
  - `UNREACHABLE` (no answer after retries) → escalate.

This replaces the representative's manual dial-and-wait with an automated,
**retried** call — fixing breakpoints #4, #5, and #6.

### Stage 3 — Customer Callback (decline path)
Only used when the center offered different slots than the customer asked for.
- **Set Confirmation Deadline** — a per-execution **Slot Hold Window** (how long the
  center will hold the new slots), capped at center close.
- **Enough Time to Confirm?** — re-check the runway against that deadline.
- **Place Outbound Call** — reuses the Outbound Call Service with the **customer agent**
  to confirm the **new date only** (never a price negotiation).
- **Customer Response?** — `ACCEPTED` → Work Order; `REJECTED / HOLD_EXPIRED /
  UNREACHABLE` → escalate.

### Stage 4 — Work Order & Confirm
A **single Lambda** calls the **Intoxalock Work Order API**, which internally
**creates the de-installation work order** and **notifies the customer (SMS + email)**.
On success → Reminders; on failure (after Retry/Catch) → escalate. This guarantees the
customer only ever gets a confirmation that is **backed by a real work order** —
fixing breakpoints #2 and #8.

### Stage 5 — Reminders
**Wait Until T-12h** → **Send Appointment Reminder** → **Succeed (Confirmed)**.
A terminal happy-path state.

### Escalation (shared)
Any unrecoverable branch routes to one shared path: a **single Lambda** calls the
**escalate-to-rep API** (which hands the case, with **full attempt history**, to a
human via the Intoxalock backend) → terminal **End (Escalated)** state. Escalation is
now the **exception**, not the default — and when it happens the rep gets a complete
record instead of starting from scratch.

---

## 3. Architecture components

| Component | Role |
|---|---|
| **Step Functions (Standard)** | The durable orchestrator. One execution per request; can wait hours/days at no compute cost; native retries, catch, and full execution history. |
| **API Gateway + `api-handler` Lambda** | Intake edge: validate, compute center-open target, create the request record, start the execution. |
| **Outbound Call Service** (nested Standard state machine, reusable) | Encapsulates the entire "place a capacity-gated, retried voice call" primitive. Invoked via `startExecution.sync` by **both** the center and customer stages. |
| **ElevenLabs + Twilio** (2 voice agents) | External AI voice service — a **center agent** and a **customer agent**. Calls are placed with `.waitForTaskToken`; the call outcome resumes the workflow. |
| **Webhook Handler Lambda** | Receives the end-of-call webhook (idempotent on `callId`), resumes the paused call via `SendTaskSuccess`, updates state, and appends to the audit log. |
| **DynamoDB — Removal Requests** | Per-request customer/center info and current appointment state. |
| **DynamoDB — Attempts Audit Log** | Append-only per-attempt history; feeds escalation. |
| **DynamoDB — Call Capacity counter** | A distributed semaphore enforcing the **global 3-concurrent-call cap** across all executions and both call types. |
| **Intoxalock Work Order API / backend** | External system of record: creates work orders, notifies customers, and handles human escalation. |
| **SSM Parameter Store** | Configurable knobs: concurrency cap, retry count/interval, slot-hold window. |

### The reusable Outbound Call Service — why it exists
Both the center call and the customer call need the *exact same* mechanics: reserve a
line under the global cap, dial, wait for the call to end, retry on no-answer, and
release the line (even on failure). Extracting this into **one child state machine**
means that logic — and the **correctness of the shared 3-call semaphore** — is
**defined once** and can't drift between the two call sites. Callers pass
`{ agent, payload, callTimeout, maxConcurrent, maxRetries }` and receive
`{ status, structuredResult }`. This is the one place nesting is justified: a tightly
scoped **primitive**, not a fragmented business stage.

---

## 4. Why event-driven architecture is the right fit

The problem is defined by **waiting, external events, and unreliable participants** —
exactly what event-driven orchestration is built for. Mapping the solution to the
problem's own root causes:

| Root cause (Problem-Definition §6) | How the event-driven design addresses it |
|---|---|
| **1. No integration** with service centers (no API, no availability) | The AI **voice agent is the integration**. The center is treated as an **external event source**: we place a call, then **pause** (`.waitForTaskToken`) until the call-end **event** arrives via webhook. No API on the center's side is required. |
| **2. Manual, phone-only coordination that doesn't retry** | Retries are **native and declarative**. The Outbound Call Service loops (wait → re-dial) up to a configurable cap. Nothing depends on a human remembering to call back — "one-and-done" becomes "followed-up-until-resolved." |
| **3. No clear confirmation step** | Confirmation is a **modeled state transition**: the customer is only notified as "confirmed" *after* the Work Order API succeeds. Request vs. appointment is now unambiguous by construction. |
| **4. No intake validation** | Validation + business-hours math happen **once, upstream** at intake; the workflow starts already-clean and simply **waits** for the right moment to act. |
| **5. Manual quote capture (vehicle-dependent)** | The quote is captured **in-band** by the voice agent during the same confirmation call and stored as **informational** data — never blocking the booking. |

### Why Step Functions specifically (vs. a cron/queue/always-on service)
- **Long, cheap waits.** A request may wait hours for a center to open or for a
  customer callback. Step Functions **suspends with no running compute** and resumes on
  an event — you don't pay for, or operate, an idle poller.
- **Human-timescale durability.** Executions can safely live for the days a booking may
  take, surviving restarts and deploys, with **no custom state persistence** to build.
- **The `waitForTaskToken` pattern fits the domain perfectly.** "Place a call →
  something happens in the real world → a webhook tells us the result" is the canonical
  callback pattern; the workflow blocks on exactly that event.
- **Built-in reliability primitives.** Declarative **Retry/Catch**, per-state error
  handling, and a complete **visual execution history** replace bespoke retry loops and
  ad-hoc logging — and that history is what makes escalations informative.
- **Observability = the diagram.** Each execution is inspectable state-by-state, so
  operators can see *exactly* where any request is (waiting on the center? on the
  customer? escalated?) — the opposite of today's opaque, "sitting in a queue" reality.

### Direct line to the project goals
- **Clarity** → confirmation is gated on a real work order (Stage 4).
- **Reliability** → capacity-aware, retried calls; nothing silently dropped (Outbound Call Service).
- **Speed** → the workflow acts the instant the center opens, in parallel across requests (up to the call cap).
- **Less friction** → humans are involved only on true exceptions, and always with full history.

---

## 5. Key design decisions

1. **One state machine, stages as visual groups** — ~40 states, nothing near ASL limits;
   avoids the ops/tracing overhead of many machines.
2. **One exception: the Outbound Call Service is a nested machine** — to define the
   shared-semaphore call primitive exactly once and reuse it from both call sites.
3. **Global 3-call cap via a DynamoDB semaphore** — the ElevenLabs concurrency limit is a
   single shared pool across *all* executions; enforced in one place with reserve/release
   (release even on Catch, so a crash never leaks a line).
4. **Quote is informational, never a gate** — matches the business rule that the customer
   confirms a *date*, not a *price*.
5. **Everything tunable lives in SSM** — concurrency cap, retry count/interval, slot-hold
   window — so operations can adjust behavior without a redeploy.
6. **Escalation is shared and history-rich** — a single terminal path, fed by every
   failure branch, that hands humans a complete record.

---

## 6. Assumptions & open items

- **ElevenLabs must carry the `taskToken`** into the call and echo it back on the webhook,
  return **structured post-call data** (confirmed/declined, slots, quote), and report
  **call status** (no-answer/busy/voicemail). Confirm the real **concurrency tier**.
- **AI-disclosure / call-recording compliance** for automated outbound calls (per-state
  regulation) needs a compliance spike.
- **Work Order API and escalate-to-rep API** contracts (idempotency, error semantics)
  to be confirmed with Intoxalock.
- **Volume**: designed for ~5,000 requests/month (~200/day) with headroom; the 3-call cap
  is the primary throughput constraint and is configurable.
- **Out of scope (by intake filter)**: requests requiring state paperwork are handled
  outside this automated flow.
