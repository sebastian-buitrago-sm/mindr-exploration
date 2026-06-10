# Device Removal Scheduling — Solution Handoff

*Prepared for Intoxalock (Mindr) · 2026-06-10*

---

## The Problem

Today, scheduling a device removal is a **manual, phone-based coordination process** between Intoxalock representatives and 5,000+ independently owned service centers that have no shared scheduling system, no real-time availability, and no API. A customer submits a removal *request* through the app or by phone, but that request is **not a confirmed appointment** — it must be picked up by a representative who then calls the center, often gets no answer, and may never follow up. The result is slow confirmations, requests that silently stall or get dropped, and customers who believe they are booked, drive to the shop, and are **turned away without a valid work order**. This drives avoidable escalations, repeated manual work for representatives, and a consistently poor customer experience.

## The Solution

We turn that ambiguous, drop-prone request into a **clearly-communicated, reliably-confirmed appointment** — automatically, with a human representative stepping in **only on exceptions**. The system works in three phases:

1. **Intake (any channel).** A customer requests removal through the app, an inbound SMS link, or a phone call handled by an **AI voice agent**. Every channel normalizes into one request and triggers the **same written acknowledgment** that makes *"request received — NOT yet a confirmed appointment"* unmistakable. An **eligibility gate** runs first: only the straightforward, no-paperwork cases are automated; anything requiring state documentation is routed to a representative (and still tracked with reminders so it can't stall). Customers pick **two 2-hour time windows**, validated against the center's operating hours so impossible slots are never submitted.

2. **Automated confirmation.** The system contacts the assigned service center with a secure, single-use link to a **Confirmation Page** where they pin an exact time and enter a price quote. If the center doesn't respond, an **escalation ladder** runs automatically — follow-up message → AI voice call → human representative — **timed to finish before the customer's requested slot**. The customer receives a status update roughly every 24 hours so they never feel forgotten. A confirmation is only declared *after* a **work order is generated** in Intoxalock's system of record — never before.

3. **As the date approaches.** Confirmed customers get an appointment reminder ~12h ahead with the time and location. Anyone still *unconfirmed* gets the opposite message — **"do not go to the center"** — the direct antidote to being turned away.

**Every path terminates** in either a confirmed appointment or a tracked human handoff. No request is ever silently dropped.

## Architecture at a Glance

The solution is built **entirely serverless on AWS** — there are no always-on servers to pay for or maintain. Because volume is modest (~100 requests/month) but each request is a **long-running, days-spanning workflow** with timers and follow-ups, the design optimizes for *correctness and reliability*, not scale.

- **AWS Step Functions** is the orchestration spine: one execution per removal request manages every wait, timer, escalation rung, and retry — and its execution history doubles as a **compliance audit trail**.
- **Lambda** functions perform each action (send a message, generate a work order, escalate); **DynamoDB** holds requests, consent records, and the message log.
- **Customer & center web pages** are served via S3 + CloudFront; **email (SES)** and **two-way SMS** handle outreach, with the **AI voice agent** as the escalation fallback.
- Escalations land as **tickets in Intoxalock's existing ticketing system** — no custom representative tool needed for v1.
- **Compliance is built in, not bolted on:** per-channel consent tracking, AI disclosure on every automated channel, data-minimized secure links, and strict "request vs. confirmed" wording throughout.

Estimated all-in running cost: **~$30–75/month**, dominated by SMS and voice fees — the compute and orchestration core is effectively free.

## Business Impact

| Today | With this solution |
|---|---|
| Requests confused for appointments → customers turned away | **Clarity** — customer always knows request vs. confirmed; warned not to go if unconfirmed |
| Unanswered centers → dropped/stalled requests | **Reliability** — automated follow-up ladder; no request silently dropped; every path ends in a confirmation or tracked handoff |
| Confirmation depends on a rep "getting to it later" | **Speed** — bounded, lead-time-aware confirmation before the requested slot |
| Every request worked manually by a representative | **Less friction** — automation handles the routine; representatives handle only exceptions |
| Manual quote lookups and repeated calls | **Lower cost & fewer escalations** — fewer turned-away trips, fewer repeat interactions |

**Bottom line:** a poor, manual, escalation-prone experience becomes a clear, reliable, mostly-automated one — improving customer satisfaction and freeing representatives for the exceptions that genuinely need a human, all on a near-zero-cost infrastructure footprint.

## What We Need From Intoxalock

A handful of integration points unblock build: the **work-order API** in the system of record, **app-push** integration, the **ticketing system** API for escalations, and **10DLC SMS brand registration** under Intoxalock's EIN (worth starting early — it has a 1–3 week lead time).
