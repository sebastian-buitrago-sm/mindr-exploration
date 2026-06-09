# A Confirmed Appointment requires a Work Order in Intoxalock's system of record

A removal is only declared a **Confirmed Appointment** *after* a **Work Order** is
generated automatically in **Intoxalock's existing system of record** — that issuance is
the gate. If it fails, the customer is **not** told "confirmed" and the request escalates
to a human. Intoxalock's system remains the system of record; this system orchestrates
and integrates with it rather than becoming the authority on work orders.

We chose this because the project's central failure mode is a customer arriving without a
valid work order, and the center "cannot remove the device without a de-installation work
order from Intoxalock." A confirmation stored only in *our* database, with the work order
issued asynchronously (or not at all), would recreate that exact failure — now worse,
because we told the customer it was confirmed (an FTC-deception risk on top of the
operational one).

## Status

proposed

## Considered options

- **Confirm now, issue work order asynchronously.** Faster customer feedback, but
  reopens the "no work order on arrival" failure. Rejected.
- **Work order out of scope (stays fully manual).** Smaller build, but doesn't close the
  core problem. Rejected.

## Consequences

- Hard dependency on an **API / integration point** into Intoxalock's system of record
  that permits automatic Work Order generation. This must be confirmed with the client
  before build (open item in the solution design).
- Reinforces the Eligibility Gate: paperwork-required removals are excluded precisely
  because their work order cannot be auto-issued.
