# PR scoring pipeline

KEO scores a pull request by running it in a Docker sandbox and comparing that telemetry to a
production baseline. The `KEO PR verification` workflow creates a job, runs the configured traffic
command, closes the telemetry window, and waits for the comparison worker to return `PASSED`,
`WARNING`, `FAILED`, or `ERROR`. The same report appears in the Keo dashboard.

## Configure GitHub

Set these repository secrets:

- `KEO_API_URL` — public base URL of the deployed KEO API, without a trailing slash.
- `KEO_VERIFICATION_TOKEN` — a high-entropy value matching the API environment variable of the same name.

Set these repository variables:

- `KEO_SERVICE_ID` — service receiving SDK telemetry from the PR sandbox.
- `KEO_BASELINE_SERVICE_ID` — production service used for the baseline.
- `KEO_PR_TEST_COMMAND` — command that sends realistic traffic to the sandboxed app
  (`http://127.0.0.1:3000` by default) so the KEO SDK emits telemetry. It receives
  `KEO_API_URL` and `KEO_VERIFICATION_JOB_ID` as environment variables. If unset, the
  workflow only hits `/api/health`.

The workflow builds the `sandbox` Docker target, starts `docker-compose.pr-sandbox.yml`
(Postgres, Redis, migrate, then the PR application), waits for the health check, runs
the traffic command, then tears the stack down. Forked PRs are skipped intentionally
because GitHub does not expose repository secrets to them.

The SDK automatically reads `KEO_VERIFICATION_JOB_ID` from the runner environment and attaches it to
every metric event. This makes every report use only telemetry from its own PR, even when multiple
PRs are verified at once. The workflow publishes a `KEO merge verification` GitHub check: `PASSED`
is successful, `WARNING` is neutral, and `FAILED` or `ERROR` blocks merging when this check is made
required in GitHub branch protection.

## Baselines and verdicts

The worker uses the latest stored baseline for `KEO_BASELINE_SERVICE_ID`. If none exists, it computes a
baseline from up to 200 historical production metric samples before the PR job and stores that snapshot.
It compares CPU, memory, latency, and errors against the PR window. Defaults are 20%, 20%, 15%, and 10%
regression respectively; a value at 75% of a threshold is a warning, and a value above it fails. A job can
override those percentages through its `thresholds` payload.

Gemini is optional: it may explain the deterministic verdict, but never controls it.
