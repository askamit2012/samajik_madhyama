# Demo ops triggers (on-demand background processing)

When you want a **$0 demo** without running an always-on worker service, use the protected ops endpoints to manually trigger background work on the backend API service.

## Enable

Set `OPS_TRIGGER_TOKEN` on the backend (Cloud Run service env var or Secret Manager mapped env var).

## Endpoints

All endpoints require either:

- `Authorization: Bearer <OPS_TRIGGER_TOKEN>` or
- `x-ops-token: <OPS_TRIGGER_TOKEN>`

### Run scheduled post publishing now

`POST /ops/scheduler/tick`

### Sweep expiring OAuth tokens now

`POST /ops/tokens/sweep`

### Process queued email campaigns now (BullMQ “waiting” jobs)

`POST /ops/campaigns/process`

Body:

```json
{ "limit": 10 }
```

## Example curl

```bash
curl -X POST "$API_BASE/ops/scheduler/tick" \
  -H "Authorization: Bearer $OPS_TRIGGER_TOKEN"
```

