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
   Schedule Device Removal,"* where a live agent takes the request.

After an app submission, the customer sees:
> *"Your request has been sent and will be worked in the order received. A
> representative will follow up with your appointment details once scheduled."*

This message is the heart of the problem: **a removal request is not a confirmed
appointment** — and, per Intoxalock's own guidance, the service center *"cannot
remove [the] device without a de-installation work order from Intoxalock."*

---

## 2. Problem Statement

> Scheduling a device removal is a **manual, phone-based coordination process**
> between Intoxalock agents and independent service centers that have **no
> real-time availability and no scheduling API**. As a result, requests are slow
> to confirm, frequently dropped, and routinely confused by customers for real
> appointments — driving avoidable escalations, repeated work for agents, and a
> poor customer experience.

---

## 3. Where it breaks (the current journey)

A removal request must travel from the customer, through a human agent, to an
independent shop — and there is no automated link between any of these steps.
The breakpoints:

| # | Stage | What goes wrong |
|---|-------|-----------------|
| 1 | **Customer submits request** | The request can be made at any time, including **impractical slots** (e.g., 10 p.m. for an 8 a.m. next-day appointment) and when the target center is **closed**. The form does not validate against real operating hours. |
| 2 | **Request ≠ appointment** | The customer often believes the submitted request **is a confirmed appointment**, then shows up at the shop. |
| 3 | **Manual agent handoff** | Every request must be **picked up and worked by a human agent**; nothing is automated. |
| 4 | **No availability data** | Service centers are independent and provide **no real-time availability and no API**. The agent has no way to see open slots and must **call the shop directly**. |
| 5 | **Service Centers don't answer** | Calls go unanswered. Historically these were **"one-and-done"** — no enforced callback — so requests **stall or get dropped** and follow-ups are missed. |
| 6 | **Quote depends on vehicle** | During the same call, the agent must also obtain a **price quote**, which depends on the **customer's vehicle type**. This data has to be looked up and the quote captured manually, and it may still change. |
| 7 | **Eligibility / paperwork mix** | Some removals require **state documentation/paperwork** and some do not. These cases are mixed together, so not every request can be safely automated or honored. |
| 8 | **Arrival without a work order** | Because the request was never truly confirmed, the customer arrives and the **service center refuses service without a valid work order → escalation.** |

---

## 4. Impact

- **Inefficient agent workload** — repeated manual calls, retries, and lookups for every request.
- **Dropped / stalled requests** — unanswered centers lead to missed follow-ups and abandoned cases.
- **Poor customer experience** — long waits, no clear confirmation, wasted trips.
- **Escalations** — customers turned away at the shop without a work order.
- **Duplicated interactions** — the same request handled multiple times across channels.

---

## 5. Stakeholders

- **Customers** — need a confirmed removal appointment to end their program.
- **Intoxalock CX / agents** — manually coordinate every request by phone.
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

## 7. Out of scope (Phase 2 — solution)

The following were discussed as *solutions* and are **not** part of this problem
definition: AI/Twilio calling agent, automated retry logic and slot-locking,
system-of-record/work-order updates, automated customer notifications,
day-level availability, vehicle-type API integration into call scripts, and the
ChatGPT-style knowledge-center chat.

---

[^centers]: **Sourcing for the "5,500+" figure.** The location count is a
    self-reported marketing claim on Intoxalock's homepage — *"With over 5,500
    service centers, most locations are less than 15 minutes from customers'
    home or work"* (intoxalock.com, accessed 2026-06-08). It is not
    independently audited and is inconsistent across Intoxalock's own pages
    (some cite "5,000+"), so treat it as approximate. The characterization of
    the centers as *independently owned and operated* comes from the 06-04
    meeting summary (*"mostly independent 'mom and pop' service centers"*) and
    is corroborated by Intoxalock's public location directory, which lists
    third-party business names (e.g., "Cars Now KC LLC", "Intense Kustom
    Audio", "NJ Interlock Mobil Service").
