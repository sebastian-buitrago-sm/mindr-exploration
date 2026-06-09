# Web-form-first for service-center confirmation, AI voice as fallback

The 06-04 meeting framed the whole solution as **voice-first**: an AI agent that *calls*
service centers to confirm appointments. We are instead leading with an **SMS + email
link to a Confirmation Page** and demoting the AI Voice Agent to the fallback rung of the
Confirmation Ladder.

We chose this because a web form is **asynchronous** (a busy mom-and-pop shop answers when
it can, not when the phone rings), **structured** (clean confirmed-time + quote +
observations, no voice transcription/parsing), **auditable** (a click is a clear record),
and it **sidesteps the heaviest compliance surface** — AI voice triggers TCPA
"artificial voice" consent rules at $500–$1,500/call, a link tap does not.

## Status

proposed

## Considered options

- **Voice-first (meeting's original).** Lowest-common-denominator channel these shops
  actually use; kept as a documented future alternative.
- **Configurable per center.** More flexible but more to build; deferred.

## Consequences

- Depends on Intoxalock having **usable SMS/email contacts** for independent centers. If
  contact is effectively phone-only or engagement is poor, the channel order flips to
  voice-first — so the ladder should keep channel order configurable rather than
  hard-wired. (Open item in the solution design.)
