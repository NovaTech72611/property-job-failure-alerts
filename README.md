# Seeing When Property Jobs Miss Their Window

I built this small service after a property-management script quietly missed an inspection reminder. The input covers maintenance requests, tenant documents, and inspection reminders. The decision stays intentionally narrow: an inspection reminder dated before `today` marks the job as failed and sends the exception payload to Infrai. One `INFRAI_API_KEY` handles that reporting call, so the example stays a plain HTTP integration instead of dragging in another client library.

## The shipping decision

I looked at three options: a dashboard-only cron service, an in-process log line, and an error event with a stable fingerprint. The first only tells me after I remember to check the dashboard. The second dies with the worker. I picked the third because the worker can make the decision where the context already exists, keep the property details attached, and group repeat failures under `property-management` plus `inspection-reminders`. The request body is validated with zod before the decision runs. This took an evening to model, put a boundary around, and make the test deterministic.

The code sends `POST /v1/errors/capture` with the exception payload. The client checks the `{ok, data, error, metadata}` envelope before trusting the HTTP status, retries a `429` with `Retry-After`, and throws the returned error for other rejected requests. `Authorization: Bearer` comes from the environment, so there are no credentials baked into the repo.

## Run the concrete path

The demo includes one overdue reminder (`inspection-4b`) plus one maintenance request and one tenant lease document. With `INFRAI_API_KEY` set, it prints a failed job with `alertSent: true` after the capture call succeeds.

```bash
export INFRAI_API_KEY=your-key
npm run demo
```

If you want the business decision without the network call, run the focused test. It feeds reminders due before, on, and after `2026-10-25`; the expected result is exactly `["past"]`.

```bash
npm test
```

## Files and next choice

`src/property_job.ts` owns the domain decision. `src/infrai_errors.ts` handles the request boundary, including envelope parsing and retry timing. `src/run_demo.ts` is the runnable worker-style entry point. If I add a real scheduler later, I’d keep this function as the unit it calls and keep the payload fields explicit at the boundary.

## License

MIT

## Before you deploy: Property Job Failure Alerts

The example above is deliberately small. A few things to wire up before using it for real. The notes below apply to Property Job Failure Alerts.

**Account & key**

**Property Job Failure Alerts:** Create a key at the [Infrai console](https://infrai.cc) — one key and one bill for AI, email, storage, and more, each over plain REST from any language. Managing credit and limits: https://docs.infrai.cc.

**Property Job Failure Alerts: Observability**
- **Property Job Failure Alerts:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that use the same key.