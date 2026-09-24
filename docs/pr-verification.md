# Production fingerprint and GitHub checks

Keo has two surfaces of the same engine:

1. **Production fingerprint** — how the live app behaves (baseline).
2. **GitHub checks** — run the PR in a sandbox, compare that telemetry to the fingerprint, post a score.

The SDK is only a sensor. Without a fingerprint, a PR cannot be scored.

---

## Production fingerprint

### What it is

A rolling contract for one Keo **application** (service ID), built from SDK metrics that are **not** tagged with a verification job.

Window: last **14 days**, up to **500** snapshots. Dashboard: **Fingerprint** (`/`).

Each fingerprint contains:

| Layer | Fields | How it is built |
| --- | --- | --- |
| Process | CPU, memory, latency, errors | Average of those snapshots |
| Routes | method + path, request count, p50, p95, error rate | Merged from `routes` on each snapshot |

IDs in paths are normalized (`/orders/42` → `/orders/:id`). Route rows only exist if the app uses `monitor.middleware()` (or otherwise calls `startRequest({ method, path })`). `monitor.start()` alone gives process metrics, not per-route p95.

### How it is built (runtime)

1. Register the app under **Applications**. Create an SDK API key.
2. In **production**, initialize the SDK with `KEO_API_KEY`, `KEO_SERVICE_ID`, and `KEO_BASE_URL` (or `KEO_API_URL`) pointing at the **Keo server**, not at the app itself.
3. Call `monitor.start()` and `app.use(monitor.middleware())`.
4. Every `metricsInterval` (default 30s) the SDK `POST`s `/api/metrics` with a Bearer SDK key. Keo forces `serviceId` from the key. `verificationJobId` is omitted.
5. The metrics worker writes rows to Postgres. Redis + **`npm run dev:workers`** (or `start:workers`) must be running or snapshots never land.
6. `GET /api/agent/fingerprint?serviceId=…` (session or SDK key) recomputes the 14-day contract. The home page calls this.

Sandbox / PR metrics use `KEO_VERIFICATION_JOB_ID` and are **excluded** from the fingerprint (`verificationJobId: null` only). They cannot pollute the baseline.

### Empty fingerprint

| What you see | Cause |
| --- | --- |
| No applications | Create one under Applications |
| Samples = 0 | SDK not posting, wrong `baseUrl`, workers down, or API key/service mismatch |
| Routes = 0, but samples > 0 | `start()` without `middleware()` — process-only baseline |
| PR job `ERROR`: insufficient production fingerprint | Same: no prod traffic before the PR |

---

## GitHub checks (PR scoring)

Copy `.github/workflows/pr-verification.yml` and `docker-compose.pr-sandbox.yml` into the **application repo** (the one with the SDK and a Docker `sandbox` target). The Keo repo’s copies are the reference.

Keo **workers must be running** on the Keo server. `complete` only enqueues a Redis job; without a worker the check waits until timeout (`ERROR`).

### Job lifecycle

`QUEUED` → (traffic window) → `COLLECTING` on `POST /complete` → `PROCESSING` → `PASSED` | `WARNING` | `FAILED` | `ERROR`.

### What the workflow does

1. Skip fork PRs (no secrets).
2. `POST /api/verifications` with `x-keo-verification-token`, repository, SHA, PR number, `serviceId`, `baselineServiceId` → `jobId`.
3. `docker build --target sandbox` and `docker compose -f docker-compose.pr-sandbox.yml up`.
4. App env: `KEO_API_URL` / `KEO_BASE_URL` (Keo server), `KEO_API_KEY`, `KEO_SERVICE_ID`, `KEO_VERIFICATION_JOB_ID=jobId`.
5. Traffic: `KEO_PR_TEST_COMMAND`, or `curl http://127.0.0.1:3000/api/health`. The SDK must emit metrics tagged with that `jobId`.
6. `POST /api/verifications/:jobId/complete`.
7. Poll `GET /api/verifications/:jobId` until a terminal status (up to ~3 minutes).
8. PR comment + check **KEO merge verification**. Workflow fails on `FAILED` or `ERROR`.

### How the score is computed

The worker loads metrics where `serviceId = KEO_SERVICE_ID` and `verificationJobId = jobId`. It builds the fingerprint for `KEO_BASELINE_SERVICE_ID` from production rows **before** the job was created.

Compared:

- Process: CPU, memory, latency, errors vs fingerprint averages
- Routes that exist on **both** sides: p95 and error rate

Delta = `(observed - baseline) / baseline`. Default limits: CPU/memory **+20%**, latency/p95 **+15%**, errors/error-rate **+10%**. Above the limit = FAIL; above 75% of the limit = WARN.

Dashboard score = average of those rows with PASS=100, WARN=70, FAIL=0. Job status = worst row (`insufficient` → `ERROR`). Gemini may add `fileHint` / `retry`; it does not change the number.

Route metrics in the PR that have **no** matching prod route are skipped (no surprise FAILs on brand-new endpoints).

### GitHub configuration

**Secrets**

| Name | Purpose |
| --- | --- |
| `KEO_API_URL` | Public Keo API URL, no trailing slash |
| `KEO_API_KEY` | SDK API key for `KEO_SERVICE_ID` (sandbox must POST `/api/metrics`) |
| `KEO_VERIFICATION_TOKEN` | Same value as `KEO_VERIFICATION_TOKEN` on the Keo server |

**Variables**

| Name | Purpose |
| --- | --- |
| `KEO_SERVICE_ID` | Application ID the sandbox SDK reports as |
| `KEO_BASELINE_SERVICE_ID` | Application ID whose **production** fingerprint is the baseline (often the same ID) |
| `KEO_PR_TEST_COMMAND` | Optional traffic against `http://127.0.0.1:3000`. If unset, only `/api/health` is hit |

To block merge, require the **KEO merge verification** check in branch protection.

Read scores in the Keo dashboard under **GitHub checks** (`/prs`).

### Sandbox image

The workflow expects a Dockerfile `sandbox` target and this compose stack (Postgres, Redis, migrate, app on port 3000). Health check is `GET /api/health` inside the app container. If your app is not this stack, adapt compose — the Keo contract is: SDK running, env vars set, traffic that produces metrics before `complete`.
