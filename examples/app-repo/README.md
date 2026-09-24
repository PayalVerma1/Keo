# Connect your product to Keo

Keo is a hosted scoring API. Do **not** add PR scoring to the Keo repository.
Add these files to **your application repo** (the service you already instrument with the SDK).

## Files to copy

| This example | Place in your repo |
| --- | --- |
| `.github/workflows/keo-pr-score.yml` | `.github/workflows/keo-pr-score.yml` |
| `docker-compose.pr-sandbox.yml` | repo root (same name) |

Your Dockerfile needs a `sandbox` target that boots the app with the Keo SDK.

## In Keo (the platform)

1. Create an **application** for this product.
2. Generate an SDK API key.
3. Run the SDK in **production** so a fingerprint exists.
4. Note `KEO_API_URL` (your deployed Keo, e.g. `https://your-keo.example.com`).

## In your GitHub repo (the product)

Secrets:

- `KEO_API_URL` — Keo server, no trailing slash
- `KEO_API_KEY` — SDK key for this application
- `KEO_VERIFICATION_TOKEN` — same value as on the Keo server

Variables:

- `KEO_SERVICE_ID` — this application’s ID
- `KEO_BASELINE_SERVICE_ID` — usually the same ID (production fingerprint)
- `KEO_PR_TEST_COMMAND` — optional traffic at `http://127.0.0.1:3000`

When someone opens a PR **on your product**, GitHub runs this workflow. It talks to Keo. The score appears on that PR and in the Keo dashboard under GitHub checks.
