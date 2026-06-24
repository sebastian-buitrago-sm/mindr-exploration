# ElevenLabs Agents (as code)

This directory manages the **Daisy** outbound scheduling agent and its tools as
version-controlled config, using the [ElevenLabs Agents CLI](https://www.npmjs.com/package/@elevenlabs/cli).

Daisy calls a **service center (shop)** on behalf of an Intoxalock customer, proposes the
customer's available time slots one at a time, and:

- confirms one slot if the shop accepts it (`confirmed_slot`), **or**
- collects up to two of the shop's own openings if none of the customer's slots fit
  (`shop_suggested_slot_1`, `shop_suggested_slot_2`),

then calls the `save_call_result` tool to persist the outcome to the backend before closing.

## Layout

```
elevenlabs/
├── agents.json                       # agent registry (name → config → live id)
├── tools.json                        # tool registry  (name → config → live id)
├── agent_configs/daisy.json          # the Daisy agent (prompt, LLM, dynamic vars, data collection)
├── tool_configs/save_call_result.json# webhook tool → POSTs the outcome to the backend
└── .env.example                      # ELEVENLABS_API_KEY (real .env is git-ignored)
```

## Current live resources

| Resource | ID |
|---|---|
| Agent (Daisy) | `agent_3801kvxng599fjfaymfcmvgnfvz9` |
| Tool (save_call_result) | `tool_5301kvxne2t5e5xbx8906becv2n6` |
| Phone number (+14422074051, Twilio) | `phnum_5501kvxnv1y0ea0r36rk6bpkpcva` |

The agent id is wired into the backend via `src/Infra/terraform.tfvars`
(`elevenlabs_agent_id`), which Terraform passes to the Lambdas as `ELEVENLABS_AGENT_ID`.

## How it integrates with the backend

- **Call initiation** (`InitiateCallUseCase.ts`) injects the customer's slots as
  `dynamic_variables`: `slot_1`…`slot_4` and `shop_phone`. The prompt references
  `{{slot_1}}`…`{{slot_4}}`.
- **Outcome capture** is delivered by the `save_call_result` webhook tool, which POSTs to
  `POST /api/v1/webhook/call-completed` with `conversation_id`, `shop_phone`,
  `confirmed_slot`, `shop_suggested_slot_1`, `shop_suggested_slot_2`. These field names
  map 1:1 to `ToolCallPayload` in `RecordCallWebhookUseCase.ts`.
- `platform_settings.data_collection` declares the same three outcome variables so the
  optional ElevenLabs **post-call webhook** path (`data.data_collection_results`) also works;
  the backend handles both payload shapes.

> **Webhook URL is environment-specific.** `tool_configs/save_call_result.json` hardcodes
> `https://d7f24w2sa1.execute-api.us-east-1.amazonaws.com/api/v1/webhook/call-completed`
> (the deployed API Gateway from `src/frontend/.env.production`). If the API Gateway URL
> changes, update this file and re-run `elevenlabs tools push`.

## Workflow

```bash
# one-time auth (stores key in ~/.elevenlabs/api_key)
npx @elevenlabs/cli auth login

# edit tool_configs/*.json, then:
npx @elevenlabs/cli tools push          # create/update tools, writes ids into tools.json

# edit agent_configs/*.json (keep tool_ids in sync with tools.json), then:
npx @elevenlabs/cli agents push         # create/update the agent, writes id into agents.json

# inspect / reconcile against the live config:
npx @elevenlabs/cli agents pull --update
npx @elevenlabs/cli agents list
```

After changing `elevenlabs_agent_id` in `terraform.tfvars`, re-deploy so the Lambdas pick
up the new value:

```bash
cd ../src/Infra && AWS_PROFILE=source terraform apply
```

## Phone number

Outbound calling needs an ElevenLabs phone number assigned to the agent. Phone numbers are
**not** managed by the CLI, but they can be managed via the ElevenLabs REST API.

Current number: **+14422074051** (Twilio), id `phnum_5501kvxnv1y0ea0r36rk6bpkpcva`,
assigned to Daisy and wired into `elevenlabs_agent_phone_number_id` in
`src/Infra/terraform.tfvars`.

To re-assign an agent to a phone number from code (`$KEY` = your ElevenLabs API key):

```bash
# list numbers + current assignment
curl -s https://api.elevenlabs.io/v1/convai/phone-numbers -H "xi-api-key: $KEY"

# assign an agent to a number
curl -X PATCH https://api.elevenlabs.io/v1/convai/phone-numbers/<phone_number_id> \
  -H "xi-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"agent_id":"agent_3801kvxng599fjfaymfcmvgnfvz9"}'
```

To import a brand-new Twilio number from code, `POST /v1/convai/phone-numbers` with
`{ phone_number, label, sid, token }` (Twilio account SID + auth token).
