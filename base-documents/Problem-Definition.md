# Problem Definition — Intoxalock Device Removal Scheduling

*Client: Mindr (brand: Intoxalock) · Prepared 2026-06-08 · Source: 06-04 Weekly Meeting + product review*

---

## 1. Background (for readers new to the product)

**Intoxalock** sells and services **ignition interlock devices (IIDs)** — in-car
breathalyzers that prevent a vehicle from starting until the driver passes a
breath test. People are required to install one (usually after a DUI conviction)
to legally regain their driving privileges. Intoxalock is a state-approved
provider in 46 states and delivers installation, calibration, and removal of the
devices through a nationwide network of **independently owned and operated
automotive service centers** — more than 5000+ locations.

A customer leases the device for a **court/state-mandated period** (the
"restriction" or lock period). When that period ends and the customer is
eligible, the device must be **physically removed at a service center**, which
requires booking an appointment.

**How a customer requests removal today** — there are exactly **two** channels:

1. **Mobile app** — the customer confirms eligibility on the *Device Removal*
   screen, then submits a *Device Removal Request* form specifying a **first and
   second preferred date/time** and a **preferred confirmation contact** (phone
   or email).
2. **By phone** — Intoxalock instructs customers to *"Call 888-283-5899 to
   Schedule Device Removal,"* where a live representative takes the request.

After an app submission, the customer sees:
> *"Your request has been sent and will be worked in the order received. A
> representative will follow up with your appointment details once scheduled."*

This message is the heart of the problem: **a removal request is not a confirmed
appointment** — and, per Intoxalock's own guidance, the service center *"cannot
remove [the] device without a de-installation work order from Intoxalock."*

---

## 2. Problem Statement

> Scheduling a device removal is a **manual, phone-based coordination process**
> between Intoxalock representatives and independent service centers that have **no
> real-time availability and no scheduling API**. As a result, requests are slow
> to confirm, frequently dropped, and routinely confused by customers for real
> appointments — driving avoidable escalations, repeated work for representatives, and a
> poor customer experience.

---

## 2.1 Project goal (expected outcome)

> The customer experience today is **poor**: a removal request gives no real
> confirmation, can sit unworked for days, frequently stalls when a center
> doesn't answer, and too often ends with the customer being **turned away at the
> shop**. The goal of this project is to **fix that experience** — to turn an
> ambiguous, manual, drop-prone request into a **clear, reliably-confirmed
> appointment**.

Concretely, success means:

- **Clarity** — the customer always knows whether they have a *request* or a
  *confirmed appointment*, and never shows up to a center without a valid work
  order.
- **Reliability** — a request is not silently dropped; unanswered centers are
  followed up on until the booking is resolved, instead of "one-and-done."
- **Speed** — confirmation happens in a predictable, short timeframe rather than
  depending on a representative manually getting to a queued request "later."
- **Less friction for everyone** — fewer repeated calls and manual lookups for
  representatives, fewer escalations, and no wasted trips for customers.

---

## 3. Where it breaks (the current journey)

A removal request must travel from the customer, through a human representative, to an
independent shop — and there is no automated link between any of these steps.
The breakpoints:

| # | Stage | What goes wrong |
|---|-------|-----------------|
| 1 | **Customer submits request** | The request can be made at any time, including **impractical slots** (e.g., 10 p.m. for an 8 a.m. next-day appointment) and when the target center is **closed**. The form does not validate against real operating hours. |
| 2 | **Request ≠ appointment** | The customer often believes the submitted request **is a confirmed appointment**, then shows up at the shop. |
| 3 | **Manual representative handoff** | Every request must be **picked up and worked by a human representative**; nothing is automated. |
| 4 | **No availability data** | Service centers are independent and provide **no real-time availability and no API**. The representative has no way to see open slots and must **call the shop directly**. |
| 5 | **Service Centers don't answer** | Calls go unanswered. Historically these were **"one-and-done"** — no enforced callback — so requests **stall or get dropped** and follow-ups are missed. |
| 6 | **Quote depends on vehicle** | During the same call, the representative must also obtain a **price quote**, which depends on the **customer's vehicle type**. This data has to be looked up and the quote captured manually, and it may still change. |
| 7 | **Eligibility / paperwork mix** | Some removals require **state documentation/paperwork** and some do not. These cases are mixed together, so not every request can be safely automated or honored. |
| 8 | **Arrival without a work order** | Because the request was never truly confirmed, the customer arrives and the **service center refuses service without a valid work order → escalation.** |

---

## 4. Impact

- **Inefficient representative workload** — repeated manual calls, retries, and lookups for every request.
- **Dropped / stalled requests** — unanswered centers lead to missed follow-ups and abandoned cases.
- **Poor customer experience** — long waits, no clear confirmation, wasted trips.
- **Escalations** — customers turned away at the shop without a work order.
- **Duplicated interactions** — the same request handled multiple times across channels.

---

## 5. Stakeholders

- **Customers** — need a confirmed removal appointment to end their program.
- **Intoxalock representatives** — manually coordinate every request by phone.
- **Independent service centers** — perform the removal; no shared scheduling system.
- **State / monitoring authorities** — may require paperwork before removal is valid.

---

## 6. Root causes (summary)

1. **No integration** with service centers (no API, no real-time availability).
2. **Manual, phone-only coordination** that doesn't retry when centers don't answer.
3. **No clear confirmation step** — customers can't tell a request from an appointment.
4. **No intake validation** — impractical times and ineligible cases are accepted.
5. **Manual quote capture** dependent on per-customer vehicle data.

---
