# Device Removal Scheduling — Solution Handoff
---

## The Problem

Today, scheduling a device removal is a manual, phone-based coordination process between Intoxalock representatives and more than 5,000 independently owned service centers — none of which share a scheduling system, publish real-time availability, or offer an API. When a customer submits a removal request through the app or by phone, that request is **not a confirmed appointment**: a representative must pick it up, call the service center, often gets no answer, and may never follow up. The result is slow confirmations, requests that quietly stall or get dropped, and customers who believe they are booked, drive to the shop, and are **turned away without a valid work order**. Every one of those failures creates an escalation, repeated manual work for representatives, and a frustrating customer experience.

## The Solution

We turn that ambiguous, drop-prone request into a **clearly communicated, reliably confirmed appointment** — handled automatically from end to end, with a human representative stepping in only for exceptions. The system works in three phases, preceded by a one-time preparation step:

**Step 0 — Preparation: build the operating-hours database.** Before the system can validate anything, we plan to consolidate a central database of operating hours for the service-center network, sourced through the **Google Places API** (with targeted web scraping where listings allow). This database becomes the reference layer for intake: customers can only choose time windows when their center is actually open, so impossible appointments are eliminated at the source. Service centers can confirm or correct their own hours directly on the Confirmation Page they receive by email or SMS, keeping the data accurate over time.

**Phase 1 — Intake, through any channel.** A customer requests removal through the app, an SMS link, or a phone call answered by an **AI voice agent**. Whatever the channel, every request follows the same path and triggers the same written acknowledgment — one that makes *"request received, not yet a confirmed appointment"* unmistakable. An **eligibility check** runs first: straightforward cases with no state paperwork proceed automatically, while anything requiring documentation is routed to a representative and tracked with reminders so it cannot stall. The customer selects **two 2-hour time windows**, validated against the center's operating hours.

**Phase 2 — Automated confirmation.** The system sends the service center an SMS and email containing a secure link to a **Confirmation Page**, where the center picks an exact time and enters a price quote. If the center doesn't reply, the system follows up on its own — first a reminder message, then an AI phone call, and finally a human representative — always paced to resolve everything before the customer's requested date. Meanwhile, the customer receives a status update roughly every 24 hours, so they are never left wondering. The appointment is only called **"confirmed"** once a real **work order** has been created in Intoxalock's system.

**Phase 3 — As the date approaches.** Confirmed customers receive an appointment reminder about 12 hours ahead, with the time and the center's location. Anyone still unconfirmed receives the opposite message — *"you do not have a confirmed appointment; please don't go to the center"* — the direct antidote to wasted trips and turn-aways.

**Every path ends somewhere deliberate** — either a confirmed appointment or a tracked handoff to an Intoxalock representative. No request is ever silently dropped.

## Architecture at a Glance

The solution is built entirely serverless on AWS, meaning there are no always-on servers to pay for or maintain. Volume is modest (roughly 50 requests per month), but each request is a long-running workflow that spans days of waits, timers, and follow-ups — so the design prioritizes **correctness and reliability** over raw scale.

- **AWS Step Functions** is the orchestration backbone: one execution per removal request manages every wait, timer, escalation step, and retry — and its execution history doubles as a compliance audit trail.
- **AWS Lambda** performs each individual action (sending a message, generating a work order, escalating a case), and **DynamoDB** stores requests, consent records, and the full message log.
- **Customer and center web pages** — the intake form and the Confirmation Page — are built and hosted on **AWS Amplify**.
- **Outreach channels:** email through **Amazon SES**, two-way SMS through **Twilio**, and an **AI voice agent built on Twilio and ElevenLabs** as the escalation fallback.
- **Authentication:** rather than introducing a new login, the plan is to explore Intoxalock's current authentication system and integrate with it directly, so customers and staff keep using their existing credentials.
- **Escalations** arrive as tickets in Intoxalock's existing ticketing system, complete with the full interaction history.
- **Compliance is built in, not bolted on:** per-channel consent tracking, AI disclosure on every automated channel, data-minimized secure links, and strict "request vs. confirmed" wording throughout.


## Business Impact

| Today | With this solution |
|---|---|
| Requests confused for appointments; customers turned away at the shop | **Clarity** — the customer always knows whether they have a request or a confirmed appointment, and is warned not to go if unconfirmed |
| Unanswered centers lead to dropped or stalled requests | **Reliability** — automated follow-ups continue until resolution; every request ends in a confirmation or a tracked handoff |
| Confirmation depends on a representative "getting to it later" | **Speed** — confirmation happens within a bounded window, always ahead of the requested date |
| Every request is worked manually by a representative | **Less friction** — automation handles the routine; representatives focus only on exceptions |
| Manual quote lookups and repeated calls | **Lower cost** — fewer escalations, fewer repeat interactions, no wasted trips |

**In Summary:** a slow, manual, escalation-prone process becomes a clear, reliable, largely automated one — improving customer satisfaction, freeing representatives for the cases that genuinely need a human, and running on a near-zero infrastructure footprint.


