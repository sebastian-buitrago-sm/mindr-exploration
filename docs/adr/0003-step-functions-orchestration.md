# Step Functions (Standard) orchestrates the Removal Request lifecycle

A Removal Request is a long-running, timer-driven workflow: it waits days on a
center or customer to act, runs lead-time-aware escalation rungs, fires ~24h/~12h
reminders, and must guarantee every branch terminates. At ~100 requests/month there
is no throughput problem — the cost driver is idle time, so the architecture is
serverless and pay-per-use throughout.

We run **one AWS Step Functions Standard execution per Removal Request**. Lambdas
remain the workers (send SMS, validate ranges, generate work order); Step Functions
owns the state between wake-ups, the timers (`Wait` states cover the ladder
deadlines, the ~24h Processing Reminder loop, the counter-offer TTL, and the T-12h
Phase 3 trigger), the pause-for-external-action (`waitForTaskToken` — a center
clicking the Confirmation Page or a customer reply resumes the execution via
`SendTaskSuccess`), and failure routing (`Retry`/`Catch` turn a failed Work Order
issuance into the human-escalation branch). The timestamped execution history
doubles as the compliance audit trail ("what did we send this customer and when")
on a TCPA/FTC-sensitive flow.

EventBridge Scheduler is **not** used at all: `Wait` states cover every per-request
timer, and the lazy operating-hours strategy (fetch at intake, cache with TTL)
eliminated the only background cron.

The ~24h Processing Reminder is **not** a parallel branch: the center wait is sliced
into ≤24h `waitForTaskToken` segments (`TimeoutSecondsPath` = min(24h, time to the
rung deadline)); each caught `States.Timeout` sends the reminder and re-arms the
wait. Resolution exits the loop, so an orphaned reminder timer is unrepresentable —
there is never a pending timer to cancel.

## Status

proposed

## Considered options

- **Hand-rolled state machine** (Lambda + DynamoDB status column + EventBridge
  Scheduler per pending timer + dispatcher Lambda). Same serverless substrate,
  ~$0.08/month cheaper, but re-implements orchestration, timer bookkeeping,
  retry/catch, and the audit log as custom code on a compliance-critical flow.
  Rejected for code-you-own risk, not cost.
- **Always-on service** (ECS/Fargate + internal cron). The ALB (~$16/mo) and NAT
  Gateway (~$32/mo) floors alone cost ~10× the entire serverless bill to serve
  3–4 requests/day, and long waits degrade into polling. Rejected on cost and fit.
- **A single Lambda.** Cannot exist: 15-minute max runtime vs. waits measured in
  days. Lambdas are the workers in every option, not an orchestration alternative.

## Consequences

- Step Functions is the orchestrator, **not** the system of record — request state
  must also live in a queryable store (DynamoDB) so "all open requests for center
  X" doesn't require crawling executions.
- Inbound events (Confirmation Page actions, SMS replies) must carry/resolve a task
  token to resume the right execution — webhook handlers are part of the design.
- Standard executions cap at 1 year — far beyond the days-to-weeks request horizon.
- In-flight executions run the state-machine **version they started with**. With
  executions living days-to-weeks, every deploy coexists with old-version executions —
  changes must stay backward-compatible at task boundaries, or ship with a
  drain/migration plan.
