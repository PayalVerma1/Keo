# Keo

Keo is a pull request scoring platform. It runs a PR in an isolated sandbox, compares the resulting telemetry against a production baseline, and posts a PASS / WARN / FAIL check plus a readable report back to GitHub.

## What Keo Does

Keo helps you:

- exercise a pull request in a Docker sandbox with the KEO SDK attached
- collect PR-window metrics and logs from that run
- compare CPU, memory, latency, and errors against a stored production baseline
- return a deterministic score and verdict, with optional Gemini explanation
- surface the report in the Keo dashboard and as a GitHub check / PR comment

## Key Features

- GitHub Actions workflow that builds a sandbox, runs traffic, and notifies Keo
- Verification API that creates a job, stores metadata, and returns a job ID
- Redis Streams dispatch to a verification worker
- Baseline comparison with configurable regression thresholds
- Optional Gemini analysis for root cause, impact, and recommendations
- Dashboard for PR scores, reports, and the applications you instrument
- TypeScript SDK that tags sandbox telemetry with `KEO_VERIFICATION_JOB_ID`

## Architecture

A developer prompt produces a GitHub PR. GitHub Actions checks out the change, builds an isolated Docker sandbox, starts the PR application with the KEO SDK, runs tests or traffic, and sends telemetry to Keo.

The verification API validates the request, stores the job, and pushes it onto the `verification-jobs` Redis stream. Workers ingest telemetry and compare PR data with the production baseline. The result is stored in PostgreSQL. Gemini may explain the evidence; it never decides the verdict. Keo then posts the GitHub check and report.

See [PR verification setup](./docs/pr-verification.md) for GitHub secrets, variables, and the traffic command that should emit SDK telemetry from your sandbox.

## Stack And Technologies

### Frontend

- Next.js 16 with the App Router
- TypeScript
- Tailwind CSS 4
- Recharts for comparison charts
- Lucide React for icons

### Backend And Data

- Node.js runtime
- PostgreSQL with Prisma ORM
- Redis for verification job streams and telemetry ingestion
- Socket.IO for live job updates while a run is in progress
- JWT-based authentication
- Background workers for metrics, logs, and PR verification

### SDK

- TypeScript SDK published from the `sdk/` package
- ES module output plus CommonJS-compatible exports
- Helpers for metrics, logs, and request instrumentation during a PR run

### AI And Analysis

- Google Generative AI for optional report explanations
- Structured recommendations stored with each verification report

## How To Use Keo

1. Create a Keo account and register the application you want to score.
2. Copy the service API key and service ID.
3. Install the SDK in that application so sandbox traffic emits telemetry.
4. Add the Keo GitHub Actions workflow and required secrets.
5. Open a pull request. Keo scores it against the production baseline.
6. Read the verdict on GitHub and the full report in the dashboard.

Example SDK setup:

```bash
pnpm add @keo-platform/monitor-sdk
```

```ts
import { Monitor } from "@keo-platform/monitor-sdk";

const monitor = new Monitor({
  apiKey: "YOUR_SERVICE_API_KEY",
  serviceId: "YOUR_SERVICE_ID",
});

monitor.start();
```

The SDK collects metrics and logs from the sandboxed PR application. When `KEO_VERIFICATION_JOB_ID` is set in the runner, every metric is attached to that job.

## Code Format And Module Style

Use TypeScript with ES modules and ES6-style `import` / `export` syntax throughout the project. The app is configured with `module: "esnext"` and `target: "ES2017"`, so modern ESM syntax is the preferred format.

Recommended conventions:

- use `import` and `export` instead of CommonJS `require`
- prefer async/await for async flows
- keep shared app code in `src/`
- keep SDK source code in `sdk/src/`

## SDK Package

From the `sdk/` directory:

- `pnpm build` - build the SDK package
- `pnpm dev` - watch TypeScript changes
- `pnpm lint` - lint SDK source files

## Planned And Possible Future Features

- numeric PR score history per repository
- custom thresholds per application
- GitHub App posting checks without polling from Actions
- sandbox orchestration owned by Keo workers
- SDK support for more runtimes and frameworks
- shareable read-only report links

## Repository Structure

- `src/app` - dashboard pages, API routes, and application layout
- `src/components` - reusable UI and dashboard widgets
- `src/lib` - auth, config, streams, workers, and server modules
- `sdk/` - standalone SDK package used inside PR sandboxes
- `prisma/` - Prisma schema and migrations

## Notes

- Keo scores the pull request application, it does not replace it.
- Use the SDK from the app that GitHub Actions runs in the sandbox.
- The dashboard reflects verification jobs and reports for your applications.
- Gemini explains a verdict. Threshold comparison decides it.
