# Communication Channels for Customer Outreach — Research Report

*Prepared 2026-06-09 · For: Intoxalock Device Removal Scheduling Automation*
*Method: multi-source web research with adversarial fact-checking (23 sources, 94 claims extracted, 25 verified, 2 refuted)*

---

## TL;DR — what to use

For US business-to-consumer outbound contact (appointment confirmations, reminders,
notifications), the evidence points to a clear ordering:

1. **SMS / text — primary channel.** Highest reach and engagement, at least as
   effective as phone calls at reducing no-shows, and dramatically cheaper. Read
   almost immediately.
2. **Email — secondary / customer's choice.** Good for detailed confirmations and
   record-keeping; lower and slower engagement than SMS. Keep it because Intoxalock
   already lets customers pick "phone or email."
3. **App push / in-app message — strong for app users.** Useful complement for the
   cohort who submitted via the mobile app.
4. **Phone / AI voice — use carefully, and only branded.** Unidentified calls are
   now routinely ignored and assumed to be fraud. Only worth it with verified/branded
   caller ID, and AI voice triggers extra legal consent requirements.
5. **WhatsApp — not recommended as primary in the US.** Far lower business-messaging
   penetration than SMS among US consumers; SMS is the de-facto US standard.

> **Bottom line for Intoxalock:** lead with **SMS** for confirmations and reminders,
> with **email** as the customer-selected alternative and **app push** for app users.
> Reserve voice for fallback — and if you use AI voice, you must have prior express
> consent and should deploy branded caller ID.

---

## 1. Channel engagement benchmarks

| Channel | Open / read rate | Response rate | Speed | Notes |
|---|---|---|---|---|
| **SMS** | ~98% read; ~90% within 3 min | ~45% (and up to ~70% for appt. reminders) | Median read in minutes | Highest engagement of any channel |
| **Email** | ~37% open (varies widely) | ~6% | ~90 min median response | Best for detail & records |
| **Phone (unknown #)** | — | **~46% of legit-business calls go unanswered**; ~80% of Americans don't answer unknown numbers | — | Spam avoidance dominates |
| **App push / portal** | Varies | An after-miss portal reminder **doubled** re-attendance vs. a mailed letter (22.2% vs 11.6%) | Immediate | Strong for existing app users |

*The SMS open/response and email figures come from industry marketing aggregators
(directional, vendor-sourced — see caveats). The phone and portal figures are from
Pew, Hiya, and peer-reviewed trials and are higher-confidence.*

---

## 2. Unknown phone calls are increasingly ignored

This is the single most important finding for deciding **against** cold voice calls as
a primary channel:

- **80% of Americans** say they don't generally answer their mobile when an unknown
  number calls. *(Pew, via CTIA — US-specific.)*
- **46% of unidentified calls go unanswered even when they come from legitimate
  businesses.** *(Hiya State of the Call 2024.)*
- **92% of consumers believe unidentified calls are fraudulent**; 43% say they will
  *never* answer an unidentified call, and 60% never call back a missed one.
  *(Hiya 2024.)*

### Branded / verified caller ID materially helps
- **77% of consumers** say they'd be more likely to answer if they knew who was
  calling. *(Hiya.)*
- **Branded Calling ID (BCID)** displays a verified business name, logo, and call
  reason on the recipient's screen — now live on Verizon and T-Mobile. *(CTIA.)*
- **STIR/SHAKEN** authenticates that a number isn't spoofed but does *not* show who is
  calling; the FCC's Oct 2025 Call Branding proposal would require carriers to transmit
  a verified caller *name* on A-level-attested calls. *(FCC FNPRM — proposed, not yet
  final.)*

> **Implication:** If Intoxalock ever calls customers (or service centers) from an AI
> voice agent, do it with **branded caller ID** so the call shows "Intoxalock" with a
> reason — otherwise a large fraction simply won't be answered.

---

## 3. Appointment-reminder evidence (peer-reviewed)

- **SMS ≈ phone calls for reducing no-shows, far cheaper.** RCT (academic primary
  care): SMS reminders matched telephone reminders (11.7% vs 10.2% missed) at a
  fraction of the cost (€230 vs €8,910 over 6 months — the gap is largely staff labor
  on manual calls).
- **SMS *on top of* a phone reminder still helps.** US pediatric-clinic RCT: adding
  SMS cut no-shows from 38.1% (phone only) to 23.5% (phone + text).
- **A second targeted text helps high-risk patients.** Kaiser Permanente pragmatic
  trial (~158k visits): a second targeted text reminder reduced no-shows 7% (primary
  care) to 11% (mental health) among high-risk patients.
- **Message wording matters as much as the channel.** Large RCT (n=161,587): a
  carefully framed SMS reminder cut no-shows to 14.2% vs 21.1% — about a one-third
  relative reduction — purely from copy changes.

> **Implication for Intoxalock:** This directly supports your goal of distinguishing
> *"request received"* from *"appointment confirmed."* The wording of the SMS is not
> cosmetic — it measurably changes whether customers show up. Design the confirmation
> and reminder copy deliberately, and consider a second reminder before the
> appointment.

*Caveat: most reminder trials are non-US (Switzerland, Poland, Israel) or US but
small/narrow (pediatric, low-income). None studied a court-mandated DUI population,
who likely have stronger compliance incentives than typical patients.*

---

## 4. Compliance — critical for a court-mandated DUI audience

Your customers are a regulated, sensitive population, so consent rules matter more here
than for ordinary marketing.

- **AI / cloned voice calls are covered by the TCPA.** FCC Declaratory Ruling
  **FCC 24-17** (effective Feb 8, 2024): AI-generated human-voice calls fall under the
  TCPA's "artificial or prerecorded voice" rules and require **prior express consent**
  before being placed (absent emergency/exemption). This applies to any AI voice agent
  calling customers.
- **Transactional vs. marketing consent tiers.** Appointment confirmations and service
  notifications are **transactional/informational**, so they need **prior express
  consent** but *not* the higher **prior express written consent** required for
  marketing. Do **not** mix promotional content into these messages, or they get
  reclassified as marketing.
- **Channel-specific consent.** Whether Intoxalock's existing "preferred confirmation
  contact = phone or email" selection at intake legally counts as prior express consent
  for **SMS** and for **AI voice** is an open question — confirm with counsel before
  launch. (See open questions.)
- **Penalties** for getting this wrong: $500/message standard, up to $1,500/message for
  willful violations.

---

## 5. Recommended design for the AI agentic system

**Customer-facing notifications (request → confirmation → reminder):**
1. **SMS-first** for: request acknowledgment ("we received your request — this is NOT
   yet a confirmed appointment"), the confirmation ("CONFIRMED: date, time, center,
   quote estimate"), and a reminder before the appointment.
2. **Email** as the alternative when the customer chose it, and for the detailed
   work-order / quote record.
3. **App push / in-app** for customers who came in through the app.
4. **Voice as fallback only**, and **branded** if used at all.

**Service-center outreach (the AI agent calling shops):**
- Branded caller ID so shops recognize Intoxalock and pick up.
- Note that AI voice → TCPA "artificial/prerecorded voice"; B2B calls have different
  consent posture than B2C, but confirm scope with counsel.

**Copy discipline:** explicitly label *request* vs. *confirmed appointment* in every
message — the framing evidence shows wording drives attendance.

---

## Caveats & source quality

- **Vendor bias:** the most quotable call-avoidance and branded-ID stats come from Hiya
  and CTIA, who sell caller-ID products. Their answer-rate-lift figures are marketing
  benchmarks, not independent measurements. Two such claims (a "21% lift" and an "86%
  unanswered" figure) were **refuted** during verification and excluded.
- **Geography:** several Hiya percentages are 6-country global aggregates, not
  US-specific. Only the Pew 80% figure is cleanly US-specific (but dates to 2020).
- **Clinical generalizability:** reminder RCTs aren't on a DUI population; effects may
  differ given stronger external compliance incentives.
- **Regulatory timing:** the FCC AI-voice ruling is final; the verified-caller-*name*
  requirement is only proposed (Oct 2025). A 2026 Fifth Circuit decision is reshaping
  telemarketing-consent specifics (it relaxed *written* vs. oral for telemarketing but
  reaffirmed that prior express consent is required).

## Open questions to resolve before build
1. US-specific (non-vendor) answer-rate lift for branded vs. unbranded calls.
2. Do no-show findings hold for a court-mandated DUI population?
3. Does the existing "phone or email" intake selection constitute valid TCPA prior
   express consent for **SMS** and **AI voice**, or is separate channel-specific
   consent needed?
4. Carrier/handset coverage and onboarding cost for branded caller ID (rollout still
   expanding through 2026).

---

## Sources

**Primary / authoritative**
- [FCC — TCPA applies to AI voice technologies (FCC 24-17)](https://www.fcc.gov/document/fcc-confirms-tcpa-applies-ai-technologies-generate-human-voices)
- [FCC 24-17 Declaratory Ruling (full text)](https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf)
- [FCC — Call Branding FNPRM, Oct 2025 (DOC-415059A1)](https://docs.fcc.gov/public/attachments/DOC-415059A1.pdf)
- [Hiya — State of the Call 2024 (PDF)](https://6751436.fs1.hubspotusercontent-na1.net/hubfs/6751436/2024/SOTC%202024/State%20of%20the%20Call%202024%20-%20Hiya.pdf)
- [Hiya — State of the Call 2024 (summary)](https://blog.hiya.com/2024-state-of-the-call-consumers-prefer-voice-but-spam-and-fraud-are-threats)
- [Hiya — State of the Call](https://www.hiya.com/state-of-the-call)
- [CTIA — Branded Calling ID launch on Verizon](https://www.ctia.org/news/new-consumer-tool-branded-calling-id-to-launch-on-verizons-network)

**Peer-reviewed appointment-reminder trials**
- [SMS vs. telephone reminders RCT (primary care)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3623700/)
- [Adding SMS to phone reminders — pediatric clinic RCT](https://pmc.ncbi.nlm.nih.gov/articles/PMC5227159/)
- [Kaiser Permanente — second targeted text reminder](https://www.thepermanentejournal.org/doi/10.7812/TPP/21.078)
- [SMS message framing RCT (n=161,587)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7310733/)
- [Post-no-show portal reminder vs. mailed letter RCT](https://pmc.ncbi.nlm.nih.gov/articles/PMC11162931/)
- [Automated SMS/telephone confirmation system study](https://www.mdpi.com/2076-3417/15/17/9773)

**Compliance / regulatory**
- [CompliancePoint — informational vs. promotional TCPA rules](https://www.compliancepoint.com/marketing-compliance/informational-vs-promotional-calls-and-texts-understanding-the-tcpa-rules/)
- [TCPA consent for appointment reminders](https://www.apptoto.com/best-practices/fcc-tcpa-consent-appointment-reminders)
- [TCPA new opt-out rules (effective Apr 2025)](https://www.bclplaw.com/en-US/events-insights-news/the-tcpas-new-opt-out-rules-take-effect-on-april-11-2025-what-does-this-mean-for-businesses.html)
- [Twilio — Oct 2025 regulatory updates](https://www.twilio.com/en-us/blog/insights/2025-october-regulatory-updates)

**Channel statistics (directional, vendor/marketing-sourced)**
- [SMS marketing stats](https://tabular.email/blog/sms-marketing-stats)
- [SMS vs. email open rates](https://www.textingonly.com/insights/sms-vs-email-open-rates/)
- [State of RCS business messaging](https://www.bandwidth.com/blog/state-of-rcs-business-messaging-features/)
