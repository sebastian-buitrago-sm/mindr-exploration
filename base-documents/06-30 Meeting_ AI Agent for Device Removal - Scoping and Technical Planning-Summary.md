# 06-30 Meeting: AI Agent for Device Removal - Scoping and Technical Planning

## Meeting Information
> Date: 2026-06-30 09:05:16
> Location: [Insert Location]
> Participants: [Yoguesh] [Speaker 2] [Speaker 3] [Speaker 4] [Hugo Armando Rodríguez Franco]
## Meeting Notes
- Topic Title: Expected Volume and Request Sources
  - The app-based removal scheduling table shows 3,233 distinct requests in the last 30 days (~100–150/day).
  - Historical overall volume is 10,000–12,000/month across categories; an estimated 8,000–9,000/month are relevant for removals.
  - IVR-originated requests are handled live by agents and are not tracked in the same table; counts are unknown.
  - Data fields include customer time-slot preferences for service centers.
  - Conclusion: Use app-derived requests (clean data) as the initial scope and basis for load assumptions.
- Topic Title: Concurrency and Call Strategy
  - Question raised about spikes and parallel calling to multiple service centers.
  - Customers are generally tied to one service center; parallel calls are not expected initially.
  - Plan to start with a single agent making sequential outbound calls during business hours.
  - Future parallelization can be considered based on adoption and data.
  - Conclusion: Implement sequential outbound calls in Phase 1.
- Topic Title: Paperwork Eligibility and State Logic
  - Phase 1 will exclude cases requiring paperwork; focus on customers who can remove at will or remove early where allowed.
  - Eligibility varies by state; the team will provide delineations of states and rules.
  - An API will pre-filter customers so the AI agent only receives eligible records.
  - Customer acknowledgments may be added for early removals without paperwork.
  - Conclusion: Backend API will handle eligibility filtering; the agent consumes a pre-vetted call list.
- Topic Title: Service Quotes and Pricing Constraints
  - The agent must obtain a service quote from the service center during the call.
  - No negotiation by Intoxal (as discussed); accept the provided quote.
  - A few price-cap states may require special handling; Tennessee excluded for now. Need confirmation of impacted states.
  - Customers may seek other service centers if prices seem high; this is largely customer-driven.
  - No need for formal PDFs; a verbal/recorded quote is sufficient for Phase 1.
  - Conclusion: Collect and record quotes without negotiation; track exceptions for cap states once confirmed.
- Topic Title: Vehicle Data for Quotes
  - The agent will receive vehicle year/make/model from the backend to support quoting.
  - Historical free-form data quality is a concern; cleanup is in progress.
  - Conclusion: Proceed using available vehicle data; monitor and flag data quality issues.
- Topic Title: Notifications and Customer Communications
  - After confirmation, backend systems will send customer notifications via push, SMS, and/or email.
  - The agent will write confirmation and quote back via provided APIs; the backend handles downstream communications.
  - Conclusion: Customer communication remains a backend responsibility post-API update.
- Topic Title: Work Orders and ERP Transactions
  - Today, agents manually create uninstall transactions that trigger work orders to service centers.
  - In the new flow, after confirmation, APIs will create required backend transactions and trigger existing work order processes.
  - Conclusion: The AI agent submits confirmations via API; the backend automates transaction creation and work orders.
- Topic Title: Escalations, Retries, and Audit Logging
  - The agent should attempt multiple calls and maintain an audit log (attempt counts, dates, outcomes).
  - Cadence and cutoff rules will be defined in the requirements (to avoid infinite loops).
  - If calls fail or times are not feasible, cases move to a manual outreach process.
  - Over time, performance data will inform coaching of service centers.
  - Notes should be written to the customer account for successful and failed interactions.
  - Conclusion: Implement audit logging and notes via APIs; escalation cadence to be finalized in requirements.
- Topic Title: Observability and Access
  - Engineering will provide observability (logs, metrics, dashboards); stack to be decided.
  - Sebastian lacks Intoxal credentials; access needs to be provisioned.
  - Separate technical sessions will align on API design and AWS implementation.
  - Conclusion: Proceed with access provisioning and schedule dev-to-dev syncs.
- Topic Title: Project Scope and Timeline
  - This AI agent work is a smaller, independent piece within a broader device removal overhaul.
  - Another session is scheduled for Thursday; requirements are being finalized this week.
  - Conclusion: Begin building the agent workflow while broader overhaul requirements are finalized.
## Next Arrangements
- Access and Provisioning
  - [ ] Provide Sebastian with Intoxal credentials and necessary system access
- Eligibility, Pricing, and Data Quality
  - [ ] Share state-by-state eligibility and early removal rules with the engineering team
  - [ ] Confirm the list of price-cap states and outline handling rules for quotes exceeding caps
  - [ ] Validate and improve vehicle data quality for year/make/model used in quoting
- Automation Rules and APIs
  - [ ] Define and document retry cadence, cutoff thresholds, and escalation path in the requirements
  - [ ] Expose APIs for: call list retrieval (pre-filtered), confirmation/quote write-back, and notes logging
  - [ ] Add an audit log schema/table to track attempts, outcomes, and agent performance metrics
- Technical Alignment and Communications
  - [ ] Schedule technical sessions to align on API design and AWS implementation details
  - [ ] Ensure customer notifications (push/SMS/email) are triggered upon confirmation via existing channels
## AI Suggestions
> AI Suggestions
> AI has identified the following issues that were not concluded in the meeting or lack clear action items; please pay attention:
> 1. The exact set of states with price caps and the handling rules are not finalized; this may impact quoting logic and validations.
> 2. Retry and escalation cadence (attempt count, intervals, and cutoff) is pending definition; without it, automation risks loops or delays.
> 3. Data quality for vehicle year/make/model may affect quote accuracy; consider validation or fallback mechanisms.
> 4. IVR-initiated requests lack tracking; if future scope includes these, define a capture mechanism for a complete volume picture.
> 5. Clarify the note structure and placement within customer accounts to ensure consistent auditability across systems.