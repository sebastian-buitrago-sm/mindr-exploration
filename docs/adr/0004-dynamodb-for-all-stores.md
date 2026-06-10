# DynamoDB for all persistent stores; no relational database

All four data kinds — Removal Request state, Consent Records, Operating Hours, and
the per-message audit log — live in DynamoDB (a table per entity, on-demand mode).
Every access pattern is a key lookup or single-dimension query (request by ID,
requests by status/center via GSI, consent by contact+channel, hours by center);
nothing joins. DynamoDB is the only AWS database with a true zero idle floor
(pay-per-request, 25 GB free) — at ~100 requests/month the bill is $0, while RDS
idles at ~$15–30/mo and Aurora Serverless v2's scale-to-zero adds resume latency.

The Quote is an attribute of the Removal Request, not its own entity — in v1 it has
no independent lifecycle (no negotiation, no payment, rep-only visibility). Revisit
if per-vehicle auto-accept thresholds (Solution Design §8.1) become real.

Consent Records get point-in-time recovery, and DynamoDB Streams can feed an
append-only export (S3) if counsel requires immutable consent history.

## Status

proposed

## Considered options

- **Postgres (Aurora Serverless v2 / RDS).** Wins if the rep UI grows real
  reporting needs (e.g. time-to-confirmation by state by month). Rejected: at this
  volume analytics is served by an S3/Athena export, not by carrying an idle
  relational instance.
