# 06-04 Weekly Meeting: Device Removal Scheduling Automation

## 1. Device Removal Scheduling Automation (Service Center Coordination)
The team aims to reduce manual effort in coordinating device removal appointments between customers and service centers. Current challenges include the absence of real-time availability from mostly independent “mom and pop” service centers, no APIs to fetch time slots, and agents relying on repeated phone calls. Customers sometimes submit requests when centers are closed (e.g., 10 p.m.) and mistakenly treat requests as confirmed appointments, leading to escalations when service centers refuse service without a work order. The impact includes inefficient agent workload, missed follow-ups when centers don’t answer, poor customer experience, and duplicated interactions. Proposed solutions include an AI agent to call service centers, confirm appointments, persistently retry when unanswered, lock slots, update internal systems, and trigger customer notifications. Alternative process suggestions include requesting “day-level” availability (letting service centers pick a time) to increase flexibility.
### Action Items
- [ ] Draft a tooling and workflow proposal comparing options (e.g., Twilio with an AI agent vs. other tooling), including expected behavior, retry logic, and integration points with internal systems; cover multiple use cases (self-service requests, live-agent calls) -- *Hugo Armando Rodríguez Franco* *Hugo Rodriguez* 2026-06-11
- [ ] Define automated calling logic: persistent call-retry schedule for service centers, rules to avoid calling when centers are closed, and criteria to “lock” an appointment slot once confirmed; include a “day-level availability” option where centers select the specific time -- *Christy* *Rachel* 2026-06-18
- [ ] Build or configure system updates and customer notifications triggered upon appointment confirmation (date, time, service center), ensuring customers receive clear confirmation to prevent “request vs. appointment” confusion -- *Christy* *Rachel* 2026-06-25
- [ ] Establish a fallback process for unanswered service centers: capture and queue interactions that were previously “one-and-done,” and mandate automated or team-driven callbacks until resolution -- *Offshore CX Team* *Christy* 2026-06-14

## 2. Vehicle-Based Removal Quote Collection Integration
Removal scheduling must also capture a price quote from the service center, which depends on the vehicle type on the customer’s account. The current process asks the service center for a quote while coordinating the appointment and informs customers that the quote may change. The impact is added complexity to automation and the need to reliably fetch vehicle data. The proposed solution is to use available APIs to provide the service center with the customer’s vehicle type within IVR/agent scripts or the AI agent’s call flow, ensuring quotes are requested and recorded alongside appointment confirmation.
### Action Items
- [ ] Map and integrate the API that retrieves the customer’s vehicle type into the automated calling flow and IVR script so the service center receives vehicle details when providing the removal quote -- *Rachel* *Christy* 2026-06-18
- [ ] Update call scripts/AI agent prompts to request and record a removal quote during the same call as scheduling, with clear messaging that the quote is an estimate and may change -- *Hugo Armando Rodríguez Franco* *Speaker 2* 2026-06-25
- [ ] Modify customer-facing confirmations to include the quoted amount (as an estimate), service center details, and appointment specifics to set expectations and reduce escalations -- *Rachel* 2026-06-25

## 3. Customer Request Intake and Eligibility Enforcement
Customers can submit removal requests via the app by selecting dates/times and confirming eligibility. Some requests occur at impractical times (e.g., 10 p.m. for 8 a.m. the next day), and some cases require state paperwork while others do not. Automation must target cases that do not require state documentation, enforce eligibility, and prevent invalid time-slot requests. The goal is to avoid impossible scheduling, ensure the right cohort is automated, and reduce agent burden.
### Action Items
- [ ] Implement eligibility gating in the automated workflow to process only customers who do not require state paperwork or confirmations; route ineligible cases to manual handling -- *Christy* *Rachel* 2026-06-14
- [ ] Add validation to the app/request intake to prevent selection of time slots that cannot be honored (e.g., next-day early slots when submitted late at night), and align displayed “first available” guidance with realistic service center operating hours -- *Speaker 1* *Rachel* 2026-06-21
- [ ] Ensure the assigned service center logic supports both default assigned centers and customer-selected alternates, with the automation targeting the correct center per request -- *Speaker 1* 2026-06-18

## 4. Knowledge Center Chat Interface Enhancement
The team is preparing a ChatGPT-like interface on the revamped knowledge center website so customers can ask questions instead of reading lengthy articles. The objective is to improve customer self-service and reduce support burden. This works alongside the device removal automation initiative and can support education on the difference between a “request” and a “confirmed appointment,” fees, and expectations.
### Action Items
- [ ] Prepare content intents and FAQs for the chat interface focusing on device removal workflows, appointment confirmation vs. request, fee payment steps, and quote expectations; align with updated automation processes -- *Rachel* *Christy* 2026-06-28
- [ ] Coordinate rollout planning and internal enablement so agents can reference the chat content and share walkthroughs with customers who call in -- *Speaker 2* 2026-07-05

> AI Suggestions
> AI has identified the following issues that were not concluded in the meeting or lack clear action items; please pay attention:
> 1. Service center operating hours and availability data source: There is no confirmed method to determine when centers are open or specific time slots. Define how automation will know “closed” hours, acceptable call windows, and any structured data sources to avoid futile outreach.
> 2. AI agent capabilities and compliance: The exact AI calling technology (Twilio vs. alternatives), call recording, consent, compliance with state regulations, and handling of escalations were not specified. These must be clarified before implementation to prevent legal or operational risks.
> 3. Appointment “lock” and system-of-record update: The process to definitively lock an appointment, generate a work order, and synchronize across systems is not detailed. Without a clear system of record and transactional update flow, customers may still arrive without a valid work order.
> 4. Quote accuracy and dispute handling: The mechanism to store the quoted amount, expose it to customers, and handle discrepancies at the service center remains undefined. Establish policies for variance thresholds, dispute resolution, and communication.
> 5. Fallback ownership and SLAs for unanswered centers: While a fallback queue is mentioned, the responsible team, retry cadence, and SLA for resolution are not fully set. Define ownership, time-based SLAs, and escalation paths to prevent stalled requests.
