# Intoxalock Device Removal Scheduling

The shared language for the device-removal scheduling automation. Intoxalock
customers must have their ignition interlock device physically removed at an
independent service center when their court/state lock period ends; this system
turns an ambiguous, manual removal request into a clearly-confirmed appointment.

## Language

**Removal Request**:
A customer's *ask* to have their device removed, with preferred date/time options.
A request is **not** a booking — it has not yet been agreed to by a service center.
_Avoid_: appointment (when unconfirmed), booking

**Confirmed Appointment**:
A specific date and time a Service Center has explicitly agreed to (the center pins
an exact hour within one of the customer's Preferred Time Ranges), backed by a valid
work order. Only a Confirmed Appointment entitles the customer to show up. On the
happy path the customer is *notified* of the pinned time, not asked to re-confirm.
_Avoid_: confirmation (ambiguous), booking

**Work Order**:
The Intoxalock-issued authorization a service center requires before it can
legally remove a device. No work order → the center refuses service. It is
**generated automatically** in Intoxalock's system of record when a center confirms,
and that issuance is the gate for declaring a Confirmed Appointment: if it fails, the
customer is *not* told "confirmed" and the request escalates to a human. Intoxalock's
system remains the system of record; this system integrates with it (integration
point is a dependency to validate).
_Avoid_: de-installation order, authorization (informal)

**Service Center**:
An independent, third-party automotive shop in Intoxalock's network that performs
removals. Has its own operating hours; provides no scheduling API and no real-time
availability.
_Avoid_: shop, vendor, location (informal use)

**Assigned Service Center**:
The single Service Center the application database associates with a customer. The
customer does **not** choose it — it is provided by the system. v1 assumes exactly
one Assigned Service Center per customer; supporting multiple candidates is a
future possibility pending client validation.
_Avoid_: preferred center, selected center (the customer does not select)

**Intoxalock Representative**:
A human Intoxalock agent who handles requests the automated pipeline cannot —
either by exception (eligibility/paperwork) or by escalation (unresolved booking).
_Avoid_: agent (ambiguous with AI agent), CX agent

**Eligibility Gate**:
The front-door check that decides whether a Removal Request may enter the
Automated Pipeline. A request qualifies only if it is past the lock period **and**
requires no state paperwork. Ineligible requests are routed to an Intoxalock
Representative (and still tracked with reminders so they cannot stall).

**Automated Pipeline**:
The end-to-end automated flow (intake → service-center confirmation → customer
notification) that handles the eligible, no-paperwork cohort without a human.

**Operating Hours**:
A Service Center's known open hours, used at intake to constrain which time slots
the customer can pick (so impossible times are never submitted). Best-effort data;
when unknown for a center, a default business-hours window is used as fallback.
Operating Hours are **not** availability — an open center may still be fully booked.
_Avoid_: availability (that is decided only by the confirmation loop)

**Confirmation Page**:
The web page a Service Center reaches via a texted/emailed link to act on a request:
it shows what the center needs to decide, captures a quote and free-text
observations, and lets the center either confirm a time or decline with a reason and
proposed alternative times. The primary service-center channel; the AI Voice Agent
is the fallback when the page goes un-actioned.
_Avoid_: portal, form (informal)
Data shown is minimized — vehicle make/model/year, requested time ranges, a
work-order reference, and at most the customer's first name. No full name, address,
license, or DUI framing. Secured by a single-use, time-expiring signed link (no login
in v1). Exact PII set is subject to counsel sign-off (DPPA / state privacy).

**AI Voice Agent**:
The automated voice caller used as a *fallback* to reach a Service Center (or, later,
customers) when web/SMS/email contact goes unanswered. Subject to TCPA artificial-voice
consent and AI-disclosure rules.
_Avoid_: IVR, robocall

**Appointment Reminder**:
A single message sent ~12h before a Confirmed Appointment with the time and center
location, on the customer's consented channel.

**Processing Reminder**:
A keep-warm message sent to the customer every ~24h *while a request is still being
worked* (after the acknowledgment, before any terminal outcome), reassuring them the
request is in progress and is still NOT a confirmed appointment. Transactional tone,
consented channel, respects quiet hours/opt-out. Stops the moment the request resolves
(confirmed, counter-offer sent, or escalated). Distinct from the Appointment Reminder
(pre-appointment) and the Non-Confirmation Warning (date-anchored "do not go").
_Avoid_: nag, chaser

**Non-Confirmation Warning**:
A message sent as a customer's *originally-requested* date nears while their request
is still unconfirmed, telling them they do **not** have a Confirmed Appointment and
must not go to the center. Anchored to the requested date, so it requires tracking
requested dates on unresolved requests.
_Avoid_: reminder (it is the opposite — a warning not to show up)

**Consent Record**:
A per-contact, per-channel, timestamped, revocable record of permission to contact
someone on a given channel (email / SMS / AI voice). Required before SMS or AI-voice
outreach (TCPA). Honoring STOP/opt-out updates it. Lives in the data model from day one.
_Avoid_: opt-in flag (too coarse — consent is per-channel)

**AI Disclosure**:
The required up-front statement, on every automated channel, that the customer/center
is interacting with an automated assistant, not a human (CA SB 1001, Utah SB 149, FTC).

**Minimum Lead Time**:
The smallest gap between "now" and the earliest selectable Preferred Time Range at
intake (e.g. ≥48–72h, tunable). Guarantees the Confirmation Ladder has room to run
before the requested slot arrives.

**Confirmation Ladder**:
The ordered escalation the system runs to get a center's answer: contact → follow-up
→ AI Voice Agent → escalate to Intoxalock Representative. Its steps are *lead-time
aware* — compressed to finish before the earliest requested slot; if runway is too
short, it escalates to a human immediately rather than running a doomed sequence.
_Avoid_: retry loop, dunning

**Quote**:
The removal price a Service Center enters on the Confirmation Page. It depends on the
customer's vehicle type. In v1 quotes are captured and surfaced to the **Intoxalock
Representative** — not shown to the customer — and are accepted as-is with no
negotiation. (Open: whether the customer ever sees the quote, and whether per-vehicle
auto-accept thresholds should exist.)
_Avoid_: price, estimate (until policy is confirmed)

**Preferred Time Range**:
A customer-selected 2-hour window (rather than an exact time) offered at intake, to
give the Service Center room to fit the removal. A request carries two such ranges.
_Avoid_: appointment time, slot (until confirmed)
