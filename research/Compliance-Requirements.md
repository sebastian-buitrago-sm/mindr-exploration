# Regulatory & Compliance Requirements — Intoxalock Removal-Scheduling AI Agent

*Client: Mindr (brand: Intoxalock) · Prepared 2026-06-09 · Scope: generative-AI customer-service agent for device-removal scheduling, USA*

> ⚠️ **Not legal advice.** This is an engineering-informed map of the regulatory
> landscape to take to qualified counsel. Several items below (especially the
> state AI laws) are new and shifting in 2026 — verify current status before
> relying on any single rule. Where two sources are listed, the **first is the
> primary/official source** (statute text or issuing agency) and the second is a
> credible explainer or status page.

---

## 0. Why compliance is load-bearing for *this* product

This is not a generic chatbot. The product combines two of the most heavily
regulated activities in US consumer law:

1. **AI-driven outbound communication** — calling/texting customers and
   independent service centers, and confirming appointments with an automated
   voice/agent.
2. **Processing DUI-related personal data** — court-restriction status, driver
   identity, and vehicle information.

Both are regulated *independently*, and the product sits squarely at their
intersection. The single most important design consequence: **consent tracking
and AI-disclosure must be in the data model from day one** — retrofitting them is
expensive and legally risky.

A second consequence ties directly to the Problem Definition: the core problem
(*a request is not a confirmed appointment*, and customers must not arrive
without a valid work order) is **also a compliance requirement**, not just a UX
goal. An AI agent that implies a request is a confirmed appointment, or confirms
a removal that state rules don't yet permit, creates FTC-deception and
state-IID-compliance exposure — see Tiers 1 and 4.

---

## 🔴 The four that matter most for this project

If attention is limited, these are the rules that most directly govern what this
agent does and carry the clearest path to fines:

| Priority | Rule | Why it's critical here |
|----------|------|------------------------|
| **#1** | **TCPA + FCC AI-voice ruling** | The agent's *whole job* is automated calls/texts. AI voice = "artificial voice" under the TCPA → requires prior express consent + opt-out. Statutory damages are **$500–$1,500 per call/text**. |
| **#2** | **AI / bot disclosure (CA SB 1001, Utah SB 149)** | Customers must be told they're talking to AI, not a human — on every channel. Cheap to build in now, painful to retrofit. |
| **#3** | **State privacy laws + DPPA** | DUI/driver/vehicle data is sensitive; you operate in 46 states, so assume broad coverage. Drives consent, deletion, disclosure, and access rights. |
| **#4** | **FTC §5 (deception) — the request-vs-appointment trap** | The agent must never let a *request* read as a *confirmed appointment*. This is the project's central problem **and** an FTC-deception risk. |

The remaining rules below are real obligations but are either lower-frequency,
lower-penalty, or only conditionally in scope.

---

## Tier 1 — AI + calling/texting (the core mechanic) 🔴 highest priority

### TCPA — Telephone Consumer Protection Act (47 U.S.C. § 227)
The foundational law restricting automated/prerecorded calls and texts. Requires
**prior express consent** (and prior express *written* consent for marketing),
identification of the caller, and **opt-out mechanisms**.
- Statute text (Cornell LII): https://www.law.cornell.edu/uscode/text/47/227
- Official U.S. Code (House): https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title47-section227&num=0&edition=prelim
- FCC TCPA rules (PDF): https://www.fcc.gov/sites/default/files/tcpa-rules.pdf

### FCC Declaratory Ruling — AI-generated voices are "artificial" (Feb 8, 2024)
The FCC confirmed that AI/cloned voices count as "artificial or prerecorded
voice" under the TCPA. **An AI voice agent calling customers needs prior express
consent**, must disclose the responsible party, and must honor opt-outs.
- Official ruling (FCC-24-17, PDF): https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf
- FCC press release: https://www.fcc.gov/document/fcc-makes-ai-generated-voices-robocalls-illegal

**Product implications:** capture and store a consent basis per contact; respect
calling-hour windows; provide a working opt-out on every channel; appointment
confirmations are "informational" (lower bar than marketing) but still need a
consent basis. Calling independent **service centers** (businesses) is
lower-risk than calling consumers, but AI-voice disclosure still applies.

### State bot / AI disclosure laws 🔴
The agent must disclose it is automated, not human, on every channel.

- **California B.O.T. Act (SB 1001)** — bot disclosure.
  - Official bill text: https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=201720180SB1001
- **Utah AI Policy Act (SB 149)** — must disclose generative-AI use to consumers.
  - Official bill (Utah Legislature): https://le.utah.gov/~2024/bills/static/SB0149.html

### CAN-SPAM — commercial email (15 U.S.C. § 7701 et seq.)
Applies to email confirmations (the removal form already offers email as a
confirmation channel). Requires accurate headers/subject lines, a physical
address, and a working unsubscribe.
- FTC compliance guide: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- Statute (Cornell LII): https://www.law.cornell.edu/uscode/text/15/7701

**Transactional vs. commercial email — the opt-out distinction.** CAN-SPAM
classifies email by its **primary purpose**. A **purely transactional/relationship**
message (e.g., *"Your removal appointment is confirmed for June 12 at 9 a.m."*)
is **exempt** from most CAN-SPAM requirements — it does **not** need an opt-out,
a physical address, or an "advertisement" label. The one rule that **always**
applies, even to transactional email: **headers and routing information must not
be false or misleading** (truthful "From" and subject line).

| Email type | Opt-out required? | Example |
|------------|-------------------|---------|
| Transactional / relationship | ❌ No | Appointment confirmation, work-order status |
| Commercial / marketing | ✅ Yes | "Book your next service for 20% off" |

**Three cautions for this product:**
1. **The purpose must be *genuinely* transactional.** An appointment
   confirmation qualifies — but the moment you add promotional content ("while
   you're here, schedule your next service at a discount"), the email becomes
   **mixed** and the full CAN-SPAM standard applies, opt-out included. Keep
   confirmations clean.
2. **CAN-SPAM is email-only.** If the confirmation goes by **SMS or call**, the
   **TCPA** governs — and there the **opt-out is mandatory even for purely
   informational/transactional messages** (the recipient must always be able to
   reply "STOP").
3. **Good practice regardless.** Even where not legally required for
   transactional email, offering a preferences/opt-out path reduces spam
   complaints and improves deliverability.

**Rule of thumb for the agent:** transactional confirmation by email → no opt-out
needed (keep it free of marketing); confirmation by SMS/call → opt-out always
required.

### Call-recording consent
If calls are recorded (likely for QA/training), ~12 states require **all-party
consent** (e.g., CA, FL). Governed by individual state wiretap statutes — no
single federal document. Identify the states you record in and have counsel
confirm. Build a recording disclosure into the call opening.

---

## Tier 2 — Data privacy (DUI / driver / vehicle data) 🔴 high priority

### DPPA — Driver's Privacy Protection Act (18 U.S.C. § 2721)
Federal law protecting personal information from **state motor-vehicle records**.
Relevant if the agent ingests or stores DMV/license-sourced data; restricts
disclosure and limits permissible uses.
- Statute text (Cornell LII): https://www.law.cornell.edu/uscode/text/18/2721
- Official U.S. Code (House): https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title18-section2721&num=0&edition=prelim

### State comprehensive privacy laws (~20 in effect in 2026)
No single federal law, but as of 2026 roughly 20 states have comprehensive
privacy statutes — **CCPA/CPRA (CA), VCDPA (VA), CPA (CO), CTDPA (CT), UCPA (UT),
TDPSA (TX)**, and more. They grant access/deletion/opt-out rights and require
disclosures. Operating in 46 states means assuming broad coverage. Map your
customer base by state to know exactly which bind you.
- IAPP US State Privacy Legislation Tracker (canonical map): https://iapp.org/resources/article/us-state-privacy-legislation-tracker
- IAPP 2026 effective-dates overview: https://iapp.org/news/a/new-year-new-rules-us-state-privacy-requirements-coming-online-as-2026-begins

### PCI-DSS — only if the agent captures payment
Not a law but contractually mandatory if the agent ever takes a card payment for
the removal quote. Governs how cardholder data is stored, processed, transmitted.
- Official PCI Security Standards Council: https://www.pcisecuritystandards.org/
- Current standard (v4.0.1): https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1

### GLBA — possible, check with counsel
Device leasing/financing *may* pull parts of the operation into GLBA's scope.
Worth a counsel review; not confirmed in scope.

---

## Tier 3 — AI-specific governance 🟡 medium priority

### Colorado AI Act (SB 24-205) — high-risk AI ⚠️ STATUS CHANGED
Landmark "high-risk AI" law. Customer-service scheduling is likely **not**
"high-risk" — but **eligibility gating** could draw scrutiny.
**Important 2026 update:** a federal court **stayed enforcement on April 27,
2026**, and Colorado passed a replacement, **SB 26-189** (signed May 14, 2026).
Use the AG hub for live status before building to it.
- Original bill (CO General Assembly): https://leg.colorado.gov/bills/sb24-205
- Colorado AG AI rulemaking hub (current status / SB 26-189): https://coag.gov/ai/

### FTC Act §5 (UDAP) + "Operation AI Comply" 🔴 (high for the deception angle)
The catch-all against unfair/deceptive practices. The FTC's "Operation AI Comply"
sweep targets deceptive AI claims and AI that misleads consumers.
**Directly relevant:** don't let the agent imply a *request* is a *confirmed
appointment* or overstate what it can do.
- FTC AI compliance hub: https://www.ftc.gov/ai
- Operation AI Comply announcement: https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes

### NIST AI Risk Management Framework (AI RMF 1.0) — voluntary
Not a law; a voluntary governance framework (GOVERN / MAP / MEASURE / MANAGE).
Useful as your governance backbone and as evidence of due diligence.
- Official page: https://www.nist.gov/itl/ai-risk-management-framework
- Framework PDF (NIST AI 100-1): https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf

### ADA Title III — accessibility
The AI channel must not become the *only* path; preserve accessible alternatives.
Courts reference **WCAG 2.1 AA** as the de facto standard.
- DOJ ADA web-accessibility guidance: https://www.ada.gov/resources/web-guidance/

---

## Tier 4 — Industry-specific (ignition interlock) 🟡 medium / domain-critical

### NHTSA Model Specifications for BAIIDs (2013 revision)
Federal model specifications for breath-alcohol ignition interlock devices,
referenced by state programs. Context for the device/program rules.
- Federal Register notice: https://www.federalregister.gov/documents/2013/05/08/2013-10940/model-specifications-for-breath-alcohol-ignition-interlock-devices-baiids
- NHTSA policymaker toolkit: https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/ignitioninterlocks_811883_112619.pdf

### Per-state IID program rules — the binding removal/paperwork rules
The rules that actually decide when a removal is valid are **per-state DMV/court
IID program regulations** — there is no single federal document. This maps
directly to breakpoint #7 in the Problem Definition (eligibility/paperwork mix).
**The agent must not confirm a removal that state rules don't yet permit** — that
is a compliance violation, not just a bad experience. Keep eligibility/paperwork
gating human-supervised until counsel confirms which states allow automation.
- Source: the specific statute/administrative code for each of the 46 operating
  states (to be compiled with counsel).

---

## 5. From regulation → product requirements

| Requirement | Driven by | What to build |
|-------------|-----------|---------------|
| **Consent model** (per-contact, per-channel, timestamped, revocable) | TCPA, FCC AI-voice, state privacy | Consent store wired into every outbound call/text/email; honor opt-outs everywhere. |
| **AI-disclosure on every channel** | CA SB 1001, Utah SB 149, Colorado AI Act, FTC | "You're speaking with an automated assistant" at the start of every interaction. |
| **Request vs. appointment clarity** | FTC §5 (deception) + project goal | Agent language and state machine must never present a request as a confirmation. |
| **State-aware eligibility gating** | Per-state IID rules, NHTSA | Block/escalate removals that state paperwork rules don't yet allow; keep human-supervised. |
| **Data rights handling** | State privacy laws, DPPA | Access/deletion/opt-out flows; restrict use of DMV-sourced data. |
| **Recording disclosure** | State all-party-consent laws | Disclose recording at call start in two-party states. |
| **Accessible fallback path** | ADA Title III | Non-AI channel remains available; web/app surfaces meet WCAG 2.1 AA. |
| **Payment data isolation** | PCI-DSS (if applicable) | Don't let the agent touch raw card data; tokenize/redirect to compliant processor. |
| **Governance program** | NIST AI RMF (evidence of diligence) | Risk policy, impact assessment, monitoring. |

---

## 6. Recommended next steps

1. **Engage counsel** on the four 🔴 items first (TCPA/FCC, AI disclosure, state
   privacy/DPPA, FTC deception) before any build.
2. **Map customers by state** to scope privacy + bot-disclosure obligations and
   compile the per-state IID removal rules.
3. **Design consent + AI-disclosure into the data model now**, not later.
4. **Confirm Colorado AI Act status** (SB 24-205 stayed; SB 26-189 in force) and
   re-scope if eligibility gating is involved.

---

### Provenance note
Cornell LII and the House U.S. Code site track current statutory text — always
cross-check the effective version. The Colorado AI Act link points to the
**original** SB 24-205; given the April/May 2026 changes, use the Colorado AG hub
for live status. Per-state IID rules and state recording-consent laws have no
single canonical document and must be compiled per state with counsel.
