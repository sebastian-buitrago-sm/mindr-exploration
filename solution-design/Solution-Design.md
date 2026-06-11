# Solution Design — Intoxalock Device Removal Scheduling Automation

*Client: Mindr (brand: Intoxalock) · Prepared 2026-06-09 · Status: draft for review*
*Companion docs: [Problem Definition](../base-documents/Problem-Definition.md) ·
[Compliance Requirements](../research/Compliance-Requirements.md) ·
[Communication Channels research](../research/Research-Communication-Channels.md) ·
[Glossary (CONTEXT.md)](../CONTEXT.md)*

---

## 1. Purpose

Turn an ambiguous, manual, drop-prone **Removal Request** into a clearly-communicated,
reliably-confirmed appointment backed by a valid **Work Order** — without a customer
ever showing up to a **Service Center** without authorization. This document captures
the solution as resolved through a structured design review; decisions are stated with
the reasoning behind them and a list of open items for the client.

The design directly serves the four project goals from the Problem Definition:
**Clarity** (request vs. appointment is never blurred), **Reliability** (no request
silently stalls), **Speed** (bounded, lead-time-aware confirmation), and **Less
friction** (humans handle only the exceptions).

---

## 2. Design principles (the load-bearing decisions)

These cut across all three phases:

1. **Eligibility-gated.** Only the past-lock-period, no-state-paperwork cohort enters
   the **Automated Pipeline**. Everything else is routed to an **Intoxalock
   Representative** — and *still tracked with reminders* so the human path can't stall
   either. (Compliance Tier 4: paperwork-required removals must not be auto-confirmed.)
2. **A confirmation means a work order.** A **Confirmed Appointment** is only declared
   *after* a Work Order is generated in Intoxalock's system of record. If issuance
   fails, the customer is **not** told "confirmed"; it escalates to a human.
3. **Every branch terminates.** Each path ends in either a Confirmed Appointment or a
   human handoff — never an open loop. Silence (by a center *or* a customer) always has
   a bounded timeout and a next step.
4. **Lead-time-aware, not wall-clock.** Retry/escalation timing is measured against the
   time remaining before the earliest requested slot, so the system never runs the
   clock out past the window the customer asked for.
5. **Consent and AI-disclosure are in the data model from day one.** Per-channel,
   timestamped, revocable **Consent Records**; AI-disclosure on every automated channel.
   (Compliance Tier 1 — retrofitting is expensive and legally risky.)
6. **Request-vs-appointment wording is enforced everywhere.** The word "confirmed" is
   reserved exclusively for a real Confirmed Appointment. (FTC §5 deception + the
   measured effect of message wording on no-shows.)
7. **Data minimization.** Third parties see the minimum needed to do their job.

---

## 3. Prerequisite — service-center data

- **Assigned Service Center.** The application database assigns exactly **one** center
  per customer; the customer does not choose it. (v1 assumption — supporting multiple
  candidate centers is a future option pending client validation.)
- **Operating Hours** are a **best-effort hint layer**, used only to constrain which
  time slots a customer can pick at intake so impossible times are never submitted.
  They are **not** availability — an open center may still be fully booked; the real
  booking happens in the Confirmation Ladder. When trusted hours are unavailable for a
  center, intake falls back to a default business-hours window rather than hard-blocking
  the customer.
- **Hours sourcing (to validate via spike).** Operating hours come **from Intoxalock's
  existing service-center database** — the system of record for the center network — and
  this system does **not** build or consolidate its own copy. A **one-time, upfront
  data-extraction process** enriches that database with operating hours **wherever they
  are missing**. This extraction is **not yet proven and will be validated with a technical
  spike** before commitment; candidate approaches include the **Google Places API** and
  **targeted web scraping** of public listings — the spike assesses coverage, accuracy,
  cost, and ToS/legal exposure of each. Enrichment runs **ahead of time, not at intake**,
  so hours are on file before a customer picks a slot. Centers also confirm or correct
  their own hours via a one-line widget on the Confirmation Page, writing back over time.

---

## 4. Phase 1 — Request intake

**Two channels, one canonical Removal Request.** Intake uses **Intoxalock's existing
channels only** — no new intake surfaces are built. All intake normalizes into a single
request object and triggers the **same** written acknowledgment, regardless of channel:

| Channel | Handling |
|---|---|
| **Mobile app** | Customer confirms eligibility and submits two **Preferred Time Ranges** (2-hour windows), constrained to the center's Operating Hours and to the **Minimum Lead Time**. |
| **Existing IVR / phone** | Intoxalock's **existing IVR/phone channel is unchanged**; the request it captures is handed to this system via integration. **No AI voice agent is used at intake** — the AI agent's role is scheduling *with the center* in Phase 2 (§5.2). The phone channel satisfies accessibility (ADA Title III) as an existing official channel. |

> SMS is **not** an intake channel — it is an **outreach** channel only (acknowledgments,
> keep-warm reminders, and the center Confirmation Page link), consent-gated per §4.

Intake rules:
- **Eligibility Gate** runs first. Ineligible / paperwork-required → routed to a human
  rep (tracked, with reminders).
- Customer picks **two 2-hour Preferred Time Ranges** (not exact times), giving the
  center room to fit the removal.
- **Minimum Lead Time** (≥48–72h, tunable): the earliest selectable range is far enough
  out that the Confirmation Ladder has room to run before the slot.
- **Consent** is captured per channel (explicit SMS opt-in, separate from "preferred
  contact"); STOP honored on SMS.
- **Written acknowledgment** fires on the consented channel(s) — email always, SMS only
  if opted in, app push for app users — with copy that makes
  **"Request received — NOT a confirmed appointment"** unmistakable, **and sets the
  expectation that the customer will receive an update every ~24h until it is confirmed**
  (the keep-warm Processing Reminder, see §5.2). This always goes out even for phone
  intake (a verbal "we got it" is the weakest form of clarity and the origin of "I
  thought it was booked").

---

## 5. Phase 2 — Getting confirmation from the center

### 5.1 The Confirmation Page (primary channel)

The center is contacted by **SMS + email containing a link** to a **Confirmation Page**.
It is the primary channel; the AI Voice Agent is the fallback (see ADR-0001).

The page is **data-minimized and secured by a single-use, time-expiring signed link**
(no login in v1):
- Shows: vehicle make/model/year (for the **Quote**), the requested time ranges, a
  work-order reference, and at most the customer's **first name**. No full name,
  address, license, or DUI framing. *(Exact PII set subject to counsel sign-off — DPPA /
  state privacy.)*
- Center actions: **confirm** a specific hour within a requested range; or **decline**
  with a reason and proposed alternative times; plus a free-text observations field and
  a **Quote** entry.

**The center pins a specific hour** inside one of the customer's pre-authorized ranges.
On the happy path the customer is **notified** of that exact time — not asked to
re-confirm (they already authorized the range at intake).

**Quote handling (v1):** captured and surfaced to the **Intoxalock Representative** —
**not shown to the customer** — and accepted as-is, no negotiation. *(Open item — see §8.)*

### 5.2 The Confirmation Ladder (lead-time-aware)

If the page is not actioned, escalation runs, **compressed to finish before the earliest
requested slot**:

```
contact center (SMS + email link)
   │  no action within the lead-time-aware window
   ▼
follow-up (SMS + email)
   │  still no action
   ▼
AI Voice Agent call (branded caller ID; AI-disclosure)
   │  still no action
   ▼
escalate to Intoxalock Representative (full interaction history; reminders until resolved)
```

If a request arrives with too little runway to run the ladder before the slot, it
**escalates to a human immediately** rather than running a doomed sequence.

**Keep-warm Processing Reminder.** While a request is still being worked (after the
acknowledgment, before any terminal outcome), the system sends the customer a
**Processing Reminder every ~24h** — *"Your removal request is still being worked; this
is NOT yet a confirmed appointment. We'll message you the moment it's confirmed."* This
removes the "am I forgotten?" anxiety dip during the waiting period and reinforces
request-vs-appointment clarity. It uses the customer's consented channel, respects quiet
hours and opt-out (TCPA), and **stops the instant the request resolves** (confirmed,
counter-offer sent, or escalated). Because the cadence is lead-time-aware and the Minimum
Lead Time is ≥48–72h, this typically fires only ~1–3 times before resolution; a request
that would receive many such reminders is, by definition, one that should already be with
a human.

### 5.3 On a successful confirmation — the Work Order gate

Center confirms a time → **a Work Order is generated automatically in Intoxalock's
system of record** → **only then** is the customer told "confirmed." If Work Order
issuance fails, the customer is **not** told confirmed and it escalates to a human.
Intoxalock's system remains the system of record; this system integrates with it.
(See ADR-0002.)

### 5.4 Decline → counter-offer loop (terminating)

When a center declines and proposes alternative times:
- The center's proposed times are treated as **held for a short TTL** (committed on the
  page), so the customer **accepting one = Confirmed Appointment with no return trip to
  the center**.
- The customer counter-offer gets its **own lead-time-aware deadline**: 1–2 nudges, then
  if still silent, **escalate to a human** — silence by the customer is treated as a
  stall, not ignored.
- If the held TTL expires before the customer accepts, the slot is released and it
  escalates to a human.

### 5.5 Human escalation

On escalation, the Intoxalock Representative receives the **full interaction history**
(what was tried, when, center responses). Reminders continue (e.g. ~24h cadence,
tunable) until the case is resolved — this is what makes "no request is silently
dropped" true on the human side.

---

## 6. Phase 3 — As the date approaches

- **Confirmed Appointment:** a single **Appointment Reminder** ~**12h before**, with
  time and center location, on the consented channel, reinforcing that this *is* a
  confirmed appointment with a work order.
- **Still unconfirmed as the originally-requested date nears:** a **Non-Confirmation
  Warning** — "you do **NOT** have a confirmed appointment, do not go to the center."
  Anchored to the customer's originally-requested date, so the system tracks requested
  dates even on unresolved requests. This is the direct antidote to the turned-away
  failure.

---

## 7. Compliance hooks (built in, not bolted on)

| Requirement | Where it lives in this design |
|---|---|
| Per-channel, timestamped, revocable consent; STOP/opt-out | Data model from day one; gates all SMS/AI-voice outreach (§4, §5). |
| AI-disclosure on every automated channel | AI Voice Agent **outbound (center) calls**; any automated chat. No AI at intake. |
| Request-vs-appointment clarity | Acknowledgment + reminder copy; "confirmed" reserved for a real Confirmed Appointment (§2.6, §4, §6). |
| State-aware eligibility gating, human-supervised | Eligibility Gate (§4); paperwork cohort never auto-confirmed. |
| Data minimization / DPPA / state privacy | Confirmation Page minimized + signed link (§5.1). |
| Call-recording disclosure (if recorded) | AI Voice Agent call opening — open item (§8). |
| Accessible non-AI path | **Existing IVR/phone channel** retained; human-rep fallback (§4). |
| Payment data isolation | No card data in this system in v1 (quotes are not paid here). |

---

## 8. Open questions for the client

These were surfaced during the review and need client/counsel input:

1. **Quote exposure & policy.** Is the Quote ever shown to the customer, or only to the
   Intoxalock Representative? Is there negotiation, or per-vehicle-type auto-accept
   ranges? *(v1 assumes: rep-only, always accepted, no negotiation.)*
2. **Multiple service centers per customer.** v1 assumes exactly one Assigned Service
   Center; confirm whether a customer can have several candidate centers.
3. **Center contact data.** Does Intoxalock have usable SMS/email contacts for the
   independent centers (required for web-form-first), or is contact effectively
   phone-only? Determines whether the channel order in ADR-0001 holds.
4. **TCPA consent scope.** Does the existing "preferred contact = phone or email"
   selection legally constitute prior express consent for **SMS** and **AI voice**, or
   is separate channel-specific consent required? (Counsel.)
5. **Work-order integration.** Confirm the API / integration point in Intoxalock's
   system of record that allows automatic Work Order generation (ADR-0002 depends on it).
6. **Eligibility/paperwork data.** What is the proportion of removals that require state
   paperwork, and is that status reliably available at intake to drive the Eligibility
   Gate?
7. **Operating-hours sourcing (spike).** A technical spike will validate whether missing
   operating hours can be reliably sourced at all — evaluating the **Google Places API**
   and **targeted web scraping** for coverage, accuracy, cost, and ToS/legal exposure —
   before the one-time upfront enrichment (§3) is committed.
8. **Call recording.** Will AI voice calls be recorded? If so, all-party-consent
   disclosure is required in ~12 states.
9. **Minimum Lead Time & cadence values.** Confirm the actual numbers (lead time,
   ladder intervals, reminder cadences) — all are tunable placeholders here.
10. **Intake integration (App + IVR).** What is the integration point by which a request
    created in the mobile app and in the **existing IVR/phone channel** reaches this
    system's `/intake` endpoint, and do those channels capture the required structured
    fields (two 2-hour Preferred Time Ranges, vehicle, eligibility) — or must this system
    validate and bounce back? (Determines whether the Operating-Hours slot constraint
    lives in the existing app UI or only in post-receipt validation.)

---

## 9. Phased delivery suggestion

- **v1 (this design):** the no-paperwork cohort, single assigned center, web-form-first
  confirmation, lead-time-aware ladder, automatic work order, consent-gated SMS/email +
  app push, AI-voice fallback, Phase 3 reminders/warnings.
- **Later:** voice-first confirmation as an alternative (the meeting's original
  proposal), multiple candidate centers, per-vehicle quote ceilings, customer-visible
  quotes, center portal with real authentication.
