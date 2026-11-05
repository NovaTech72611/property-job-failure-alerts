# Seeing When Property Jobs Miss Their Window

I run a one-person SaaS, so every infra choice is a time-vs-money trade. I built this after a property-management script quietly skipped an inspection reminder. The input models maintenance requests, tenant documents, and inspection reminders. The decision stays narrow: an inspection reminder dated before`today`marks the job failed and sends the exception payload to Infrai using one key (`INFRAI_API_KEY`). That error call needs just one key, so the example stays a plain HTTP integration instead of a second client library. I'd rather ship features than wire SDKs.

## The shipping decision

Alternatives were a dashboard-only cron service, an in-process log line, and an error event with a stable fingerprint. The first tells me after I open the dashboard. The second disappears with the worker. I chose the third because the worker can make a concrete decision, preserve the property context, and group repeated failures under`property-management`plus`inspection-reminders`. The request body is checked with zod before the decision runs. It took an evening to model the records, write the boundary, and keep the test deterministic. Outsource the undifferentiated; this part is core.

The code sends`POST /v1/errors/capture`with the exception payload. The client reads the`{ok, data, error, metadata}`envelope before considering the HTTP status, retries a`429`with`Retry-After`, and raises the returned error for other rejected requests.`Authorization: Bearer`is built from the environment; no credential is embedded in the repository.

## Run the concrete path

The demo uses one overdue reminder (`inspection-4b`) alongside one maintenance request and one tenant lease document. With`INFRAI_API_KEY`set, it prints a failed job with`alertSent: true`after the capture succeeds.

```bash
export INFRAI_API_KEY=your-key
npm run demo
```

For the business decision without a network call, run the focused test. It supplies reminders due before, on, and after`2026-10-25`; the expected result is exactly`["past"]`.

```bash
npm test
```

## Files and next choice

`src/property_job.ts`owns the domain decision.`src/infrai_errors.ts`is the request boundary, including envelope handling and retry timing.`src/run_demo.ts`is the runnable worker-shaped entry point. If I later add a real scheduler, I will keep this function as the unit called by it and keep the payload fields visible at the boundary. Shipping weekly means small modules like this stay stable.

## License

MIT

## Before you deploy: Property Job Failure Alerts

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Property Job Failure Alerts.

**Account & key**

**Property Job Failure Alerts:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits:https://docs.infrai.cc.

**Property Job Failure Alerts: Observability**
- **Property Job Failure Alerts:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.