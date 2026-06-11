# Device Removal Scheduling — Solution Handoff

*Proposed design — not yet built. This document describes the approach we recommend, for review.*

## The Problem

Scheduling a device removal today is a manual, phone-based process. Intoxalock representatives coordinate with more than 5,000 independently owned service centers, and none of those centers share a scheduling system, publish their availability, or offer an API we could integrate with. When a customer submits a removal request through the app or by phone, what they have created is a request, not a confirmed appointment. A representative has to pick it up and call the center, often gets no answer, and in some cases the request is never followed up on.

The consequences are predictable. Confirmations are slow, requests stall or get dropped, and customers who assume they are booked drive to the shop only to be turned away because there is no valid work order. Each of those cases becomes an escalation, more manual work for the representative, and a poor experience for the customer.

## The Solution

The goal is to turn that ambiguous request into a confirmed appointment backed by a real work order, with the process running mostly on its own and a representative stepping in only when something genuinely needs a person. What follows is a proposed design; nothing here is built yet. The work would break into three phases, plus a one-time preparation step.

**Step 0 — Enrich Intoxalock's existing service-center data with publicly available operating hours.** Rather than build a new database, we would take the service-center records Intoxalock already maintains and add each center's publicly available operating hours. With those hours on file, intake can hold customers to time windows when their center is actually open. We would first confirm the best way to collect that data (for example, the Google Places API or public listings) through a short technical spike.

**Phase 1 — Intake.** Customers would request a removal the way they do today: through the app or Intoxalock's existing phone/IVR line. We would not add new intake channels, and there would be no AI agent at this stage. However the request arrives, it would follow the same path and produce the same written acknowledgment, worded so the customer understands it is a request and not yet a confirmed appointment. An eligibility check would run first. Straightforward cases with no state paperwork would continue automatically; anything that needs documentation would go to a representative and be tracked with reminders so it does not stall. The customer would pick two 2-hour windows, checked against the center's operating hours.

**Phase 2 — Confirmation.** The system would send the service center an SMS and email with a secure link to a Confirmation Page, where the center would select an exact time and enter a price quote. If the center did not respond, the system would follow up on its own: a reminder message first, then an AI phone call, and a human representative as a last resort. The timing would be tied to the customer's requested date, so everything resolves before then. While this is happening, the customer would get a status update about once a day. The appointment would only be called "confirmed" once a work order has actually been created in Intoxalock's system.

**Phase 3 — Ahead of the appointment.** Customers with a confirmed appointment would get a reminder roughly 12 hours out, with the time and the center's location. Customers whose request was never confirmed would get the opposite message, telling them not to go to the center. That second message is what would prevent the wasted trips and turn-aways that happen today.

Either way, every request would end somewhere definite: a confirmed appointment or a tracked handoff to a representative. Nothing would be dropped silently.

## Architecture at a Glance

The system would be built fully serverless on AWS, so there would be no always-on servers to maintain or pay for while idle. Volume is low, around 50 requests a month, but each request is a long-running workflow that can span several days of waits, timers, and follow-ups. That pushed the proposed design toward correctness and reliability rather than scale.

- **AWS Step Functions** would run the orchestration. There would be one execution per removal request, handling every wait, timer, retry, and escalation, and its history would double as an audit trail.
- **AWS Lambda** would handle the individual actions (sending a message, generating a work order, escalating a case), and **DynamoDB** would store the requests, consent records, and message log.
- The two web pages, the intake form and the Confirmation Page, would be built and hosted on **AWS Amplify**.
- Outreach would go out by email (**Amazon SES**) and two-way SMS (**Twilio**), with an AI voice agent (Twilio plus ElevenLabs) for the follow-up calls.
- For authentication, the plan is to integrate with Intoxalock's existing system rather than introduce a new login, so customers and staff keep using their current credentials.
- Escalations would land as tickets in Intoxalock's existing ticketing system, with the full interaction history attached.
- Compliance would be part of the design from the start: per-channel consent tracking, AI disclosure on the automated channels, data-minimized secure links, and consistent "request vs. confirmed" wording.

## Business Impact

| Today | With the proposed solution |
|---|---|
| Requests get confused for appointments, and customers are turned away at the shop | Customers would always know whether they have a request or a confirmed appointment, and would be told not to go if it is not confirmed |
| Unanswered centers lead to dropped or stalled requests | Follow-ups would continue until the request resolves, ending in either a confirmation or a tracked handoff |
| Confirmation waits on a representative getting to it later | Confirmation would happen within a bounded window, ahead of the requested date |
| Every request is worked by hand | Automation would handle the routine cases, and representatives would focus on the exceptions |
| Manual quote lookups and repeat calls | Fewer escalations, fewer repeat interactions, and no wasted trips |

In short, a slow and manual process would become a largely automated one that is clearer for customers and lighter for representatives, with very little infrastructure to run.
