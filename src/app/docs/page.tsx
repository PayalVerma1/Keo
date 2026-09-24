"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { CheckCircle2, Copy } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useSocketState } from "@/lib/useSocketState";
import { Topbar } from "@/components/layout/topbar";

interface ServiceSummary {
  id: string;
  name: string;
  description?: string;
}


const CODE_INIT = [
  'import { Monitor } from "@keo-platform/monitor-sdk";',
  "",
  "const monitor = new Monitor({",
  '  apiKey: "YOUR_SERVICE_API_KEY",   // Dashboard > Services > API Key',
  '  serviceId: "YOUR_SERVICE_ID",     // Dashboard > Services > copy ID',
  '  baseUrl: process.env.KEO_BASE_URL ?? process.env.KEO_API_URL, // Keo server, not this app',
  "  metricsInterval: 30000,           // Send metrics every 30 s (optional)",
  "});",
  "",
  "monitor.start();",
].join("\n");

const CODE_EXPRESS = [
  'import express from "express";',
  "",
  "const app = express();",
  "app.use(monitor.middleware());",
  "",
  "app.listen(3000, () => {",
  '  monitor.log.info("Server running on port 3000");',
  "});",
].join("\n");

const CODE_LOGS = [
  'monitor.log.info("User authenticated successfully");',
  'monitor.log.warn("Rate limit approaching — 80% utilised");',
  'monitor.log.error("Database connection timeout", { host: "db-01" });',
  'monitor.log.debug("Cache HIT for key: session:xyz");',
].join("\n");

const CODE_DEPLOY = [
  'await monitor.deployments.track("v2.1.0");',
  'await monitor.deployments.track(process.env.GIT_SHA ?? "unknown");',
].join("\n");

const CODE_SHUTDOWN = [
  'process.on("SIGTERM", async () => {',
  "  await monitor.shutdown();",
  "  process.exit(0);",
  "});",
].join("\n");

const TOC = [
  { id: "quickstart", label: "Quick start" },
  { id: "fingerprint", label: "Production fingerprint" },
  { id: "pr-scoring", label: "GitHub checks" },
  { id: "mcp", label: "Cursor MCP" },
  { id: "install", label: "SDK" },
  { id: "api", label: "API" },
];

const CODE_FULL = [
  'require("dotenv/config");',
  "",
  'const express = require("express");',
  'const { Monitor } = require("@keo-platform/monitor-sdk");',
  "",
  "const monitor = new Monitor({",
  "  apiKey: process.env.KEO_API_KEY,",
  "  serviceId: process.env.KEO_SERVICE_ID,",
  "  baseUrl: process.env.KEO_BASE_URL,",
  "  metricsInterval: 10_000,",
  "});",
  "",
  "monitor.start();",
  "",
  "const app = express();",
  "app.use(monitor.middleware());",
  "",
  'app.get("/health", (req, res) => {',
  '  monitor.log.info("Health check called");',
  '  res.json({ status: "ok" });',
  "});",
  "",
  "app.listen(4000, () => {",
  '  monitor.log.info("App started on port 4000");',
  '  monitor.deployments.track("v1.0.0");',
  "});",
  "",
  'process.on("SIGINT", async () => {',
  "  await monitor.shutdown();",
  "  process.exit(0);",
  "});",
].join("\n");

function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "relative", marginBottom: "20px" }}>
      <button
        onClick={copy}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "var(--hover-fill)",
          border: "none",
          borderRadius: "6px",
          padding: "6px 10px",
          cursor: "pointer",
          color: copied ? "var(--accent-green)" : "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "11px",
          transition: "color 0.2s ease",
        }}
      >
        {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre
        style={{
          background: "var(--code-bg)",
          borderRadius: "8px",
          padding: "20px",
          overflowX: "auto",
          fontFamily: "monospace",
          fontSize: "13px",
          lineHeight: "1.7",
          border: "1px solid var(--border-color)",
          margin: 0,
        }}
      >
        <code style={{ color: "#e2e8f0" }}>{code}</code>
      </pre>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: "56px", scrollMarginTop: "80px" }}>
      <h2
        style={{
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "16px",
          color: "var(--text-primary)",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code style={{ background: "var(--hover-fill)", padding: "2px 7px", borderRadius: "4px", fontSize: "13px", fontFamily: "monospace", color: "var(--accent-chrome)" }}>
      {children}
    </code>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: "20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "var(--hover-fill)" }}>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  fontSize: "11px",
                  letterSpacing: "0.5px",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 14px",
                    color: j === 0 ? "var(--accent-chrome)" : "var(--text-secondary)",
                    fontFamily: j === 0 ? "monospace" : undefined,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [applicationCount, setApplicationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const loadDocsData = async () => {
      try {
        const [servicesRes] = await Promise.all([
          fetch("/api/services"),
        ]);

        if (!servicesRes.ok) throw new Error("Failed to load applications");

        const serviceList = (await servicesRes.json()) as ServiceSummary[];

        setApplicationCount(serviceList.length);
      } catch (err: any) {
        setError(err.message || "Unable to load docs data");
      } finally {
        setLoading(false);
      }
    };

    loadDocsData();
  }, [status]);

  const handleLogout = () => signOut({ callbackUrl: "/login" });
  const socketState = useSocketState();

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="layout-wrapper">
      <Sidebar activePath="/docs" onLogout={handleLogout} userName={session?.user?.name ?? ""} socketState={socketState} />
      <main className="main-content">
        <Topbar userName={session?.user?.name ?? undefined} />
        <div className="dashboard-scroll-area">
          <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", paddingBottom: "40px" }}>
            <style>{`
              .docs-shell { display: flex; gap: 24px; align-items: flex-start; }
              .docs-toc { width: 220px; flex-shrink: 0; position: sticky; top: 16px; align-self: flex-start; padding: 8px 0; }
              .docs-main { flex: 1; min-width: 0; }
              .docs-chip { display: inline-block; background: rgba(165,180,252,0.12); border: 1px solid rgba(165,180,252,0.22); color: #a5b4fc; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
              .docs-card { background: var(--hover-fill); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; }
              .docs-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
              .docs-stat-grid { display: grid; gap: 16px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 24px; }
              @media (max-width: 1024px) {
                .docs-shell { flex-direction: column; }
                .docs-toc { display: none; }
              }
              @media (max-width: 768px) {
                .docs-stat-grid, .docs-grid { grid-template-columns: 1fr; }
              }
            `}</style>

            <div className="docs-shell">
            <nav className="docs-toc" aria-label="Docs sections">
              {TOC.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", padding: "6px 0", textDecoration: "none" }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <main className="docs-main">
              <div className="card" style={{ marginBottom: "24px", padding: "24px" }}>
                <div className="docs-chip">Two flows, one engine</div>
                <h1 style={{ fontSize: "34px", fontWeight: 800, marginBottom: "10px", lineHeight: 1.15 }}>Fingerprint, then PR score</h1>
                <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "720px" }}>
                  Keo is the scoring service, not the repo you PR. Developers put the SDK in <strong>their</strong> production app, then copy <InlineCode>examples/app-repo/.github/workflows/keo-pr-score.yml</InlineCode> into <strong>their</strong> GitHub repo. Their PRs call your Keo API. This Keo repository does not score its own pull requests.
                </p>
              </div>

              {error && <div className="form-error" style={{ marginBottom: "16px" }}>{error}</div>}

              <div className="docs-stat-grid">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Applications</span>
                  </div>
                  <div className="stat-value">{loading ? "…" : applicationCount}</div>
                  <div className="stat-trend trend-up">Registered</div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Fingerprint</span>
                  </div>
                  <div className="stat-value">14d</div>
                  <div className="stat-trend trend-up">Prod snapshots</div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Score</span>
                  </div>
                  <div className="stat-value">0–100</div>
                  <div className="stat-trend">PASS 100 / WARN 70 / FAIL 0</div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Check</span>
                  </div>
                  <div className="stat-value">KEO</div>
                  <div className="stat-trend">merge verification</div>
                </div>
              </div>

              <Section id="quickstart" title="Quick start">
                <div className="docs-grid">
                  {[
                    { step: "1", title: "Build the fingerprint", desc: "Register an application, install the SDK in production with start() plus middleware(). Open Fingerprint until samples and routes appear." },
                    { step: "2", title: "Add the workflow to THEIR repo", desc: "Copy examples/app-repo/.github/workflows/keo-pr-score.yml into the product GitHub repo, not into Keo. Point secrets at your deployed Keo." },
                    { step: "3", title: "Read GitHub checks", desc: "Each PR shows on /prs, as a PR comment, and as KEO merge verification. Same engine as would_this_regress." },
                  ].map((s) => (
                    <div key={s.step} className="docs-card">
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(165,180,252,0.15)", color: "#a5b4fc", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "15px", marginBottom: "12px" }}>{s.step}</div>
                      <div style={{ fontWeight: 600, marginBottom: "6px" }}>{s.title}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section id="fingerprint" title="Production fingerprint">
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
                  A fingerprint is the baseline for one application: how production actually runs. It is not a test suite. Dashboard home (<InlineCode>/</InlineCode>) loads <InlineCode>GET /api/agent/fingerprint</InlineCode>.
                </p>
                <ol style={{ margin: "0 0 20px 18px", padding: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                  <li>Create an application. Generate an SDK API key.</li>
                  <li>In production, initialize the SDK with <InlineCode>apiKey</InlineCode>, <InlineCode>serviceId</InlineCode>, and <InlineCode>baseUrl</InlineCode> pointing at the <strong>Keo server</strong> (or <InlineCode>KEO_BASE_URL</InlineCode> / <InlineCode>KEO_API_URL</InlineCode>).</li>
                  <li>Call <InlineCode>monitor.start()</InlineCode> (process metrics) and <InlineCode>monitor.middleware()</InlineCode> (p95 and errors per route).</li>
                  <li>SDK posts <InlineCode>/api/metrics</InlineCode>. Rows have no job id. Redis workers must be running.</li>
                  <li>Fingerprint = last 14 days, up to 500 of those rows. Process = averages. Routes = merged p50/p95/error rate. Numeric path segments become <InlineCode>:id</InlineCode>.</li>
                </ol>
                <Table
                  headers={["Symptom", "Meaning"]}
                  rows={[
                    ["Samples 0", "SDK not reaching Keo, wrong URL/key, or workers not running"],
                    ["Routes 0, samples > 0", "start() without middleware() — process-only baseline"],
                    ["PR ERROR: insufficient fingerprint", "No production traffic before the PR"],
                  ]}
                />
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Sandbox metrics use <InlineCode>KEO_VERIFICATION_JOB_ID</InlineCode> and are excluded, so a PR cannot rewrite the baseline.
                </p>
              </Section>

              <Section id="pr-scoring" title="GitHub checks">
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
                  Keo does not run this check on Keo PRs. Copy <InlineCode>examples/app-repo/.github/workflows/keo-pr-score.yml</InlineCode> and <InlineCode>examples/app-repo/docker-compose.pr-sandbox.yml</InlineCode> into the <strong>product repo you monitor</strong>. That workflow POSTs to <InlineCode>KEO_API_URL</InlineCode> (your Keo deploy). Keep Keo workers running. Guide: <InlineCode>examples/app-repo/README.md</InlineCode>.
                </p>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: 1.6 }}>
                  Job states: <InlineCode>QUEUED</InlineCode> → traffic window → <InlineCode>COLLECTING</InlineCode> on complete → <InlineCode>PROCESSING</InlineCode> → terminal verdict.
                </p>
                <ol style={{ margin: "0 0 20px 18px", padding: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                  <li>PR opened/updated (forks skipped — no secrets).</li>
                  <li><InlineCode>POST /api/verifications</InlineCode> with <InlineCode>x-keo-verification-token</InlineCode> → <InlineCode>jobId</InlineCode>.</li>
                  <li>Sandbox boots with <InlineCode>KEO_API_URL</InlineCode>, <InlineCode>KEO_API_KEY</InlineCode>, <InlineCode>KEO_SERVICE_ID</InlineCode>, <InlineCode>KEO_VERIFICATION_JOB_ID</InlineCode>.</li>
                  <li>Traffic via <InlineCode>KEO_PR_TEST_COMMAND</InlineCode> or <InlineCode>GET /api/health</InlineCode>. SDK metrics attach only to that job.</li>
                  <li><InlineCode>POST /api/verifications/:jobId/complete</InlineCode>. Worker compares those metrics to the fingerprint of <InlineCode>KEO_BASELINE_SERVICE_ID</InlineCode> from prod rows before the job.</li>
                  <li>Per-metric PASS / WARN / FAIL. Score = average (100 / 70 / 0). Worst metric is the job verdict. New PR routes with no prod twin are skipped.</li>
                  <li>Dashboard <InlineCode>/prs</InlineCode>, PR comment, and check <InlineCode>KEO merge verification</InlineCode>. Workflow fails on FAILED or ERROR.</li>
                </ol>
                <Table
                  headers={["Job verdict", "Score", "GitHub check"]}
                  rows={[
                    ["PASSED", "Every compared row within limit", "success"],
                    ["WARNING", "A row above 75% of its limit", "neutral"],
                    ["FAILED", "A row above 100% of its limit", "failure — require the check to block merge"],
                    ["ERROR", "No PR telemetry, no fingerprint, or timeout", "failure"],
                  ]}
                />
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: 1.6 }}>
                  Default limits: +20% CPU/memory, +15% latency and route p95, +10% errors. Gemini may add fileHint/retry; it does not change the score.
                </p>
                <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "10px", color: "var(--text-secondary)" }}>Secrets and variables (app repo)</h3>
                <Table
                  headers={["Name", "Type", "Purpose"]}
                  rows={[
                    ["KEO_API_URL", "Secret", "Public Keo API URL, no trailing slash"],
                    ["KEO_API_KEY", "Secret", "SDK key so the sandbox can POST /api/metrics"],
                    ["KEO_VERIFICATION_TOKEN", "Secret", "Must match KEO_VERIFICATION_TOKEN on the Keo server"],
                    ["KEO_SERVICE_ID", "Variable", "Application the sandbox SDK reports as"],
                    ["KEO_BASELINE_SERVICE_ID", "Variable", "Application whose production fingerprint is the baseline (often the same ID)"],
                    ["KEO_PR_TEST_COMMAND", "Variable", "Optional traffic at http://127.0.0.1:3000; otherwise only /api/health"],
                  ]}
                />
              </Section>

              <Section id="mcp" title="Cursor MCP">
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
                  Copy <InlineCode>.cursor/mcp.json.example</InlineCode> into <InlineCode>.cursor/mcp.json</InlineCode>. Tools: <InlineCode>get_fingerprint</InlineCode> (the contract) and <InlineCode>would_this_regress</InlineCode> (same comparison as a GitHub check; pass <InlineCode>jobId</InlineCode> or local <InlineCode>observed.routes</InlineCode>).
                </p>
                <CodeBlock code={`{
  "mcpServers": {
    "keo": {
      "command": "npx",
      "args": ["tsx", "mcp/src/index.ts"],
      "env": {
        "KEO_API_URL": "http://localhost:3000",
        "KEO_API_KEY": "YOUR_SERVICE_API_KEY",
        "KEO_SERVICE_ID": "YOUR_SERVICE_ID"
      }
    }
  }
}`} />
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "16px 0", lineHeight: 1.6 }}>
                  From the repo root: <InlineCode>npm --prefix mcp install</InlineCode> then the agent can call the tools. Pass <InlineCode>observed.routes</InlineCode> from <InlineCode>monitor.metrics.peek()</InlineCode> after a local run.
                </p>
              </Section>

              <Section id="install" title="Installation">
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
                  Install via your preferred package manager:
                </p>
                <CodeBlock code={`# npm\nnpm install @keo-platform/monitor-sdk\n\n# yarn\nyarn add @keo-platform/monitor-sdk\n\n# pnpm\npnpm add @keo-platform/monitor-sdk`} language="bash" />
              </Section>

              <Section id="config" title="Configuration">
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
                  Pass a <InlineCode>MonitorConfig</InlineCode> object to the <InlineCode>Monitor</InlineCode> constructor:
                </p>
                <Table
                  headers={["Option", "Type", "Default", "Description"]}
                  rows={[
                    ["apiKey", "string", "required", "Service-scoped API key from Dashboard → Profile → API Keys"],
                    ["serviceId", "string", "required", "UUID of your service (Dashboard → Services)"],
                    ["baseUrl", "string", "KEO_BASE_URL or KEO_API_URL or localhost:3000", "Keo server URL, not your app URL"],
                    ["metricsInterval", "number", "30000", "How often (ms) to auto-send CPU/memory metrics"],
                  ]}
                />
              </Section>

              <Section id="sdk-usage" title="SDK Usage">
                <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "10px", color: "var(--text-secondary)" }}>Initialization</h3>
                <CodeBlock code={CODE_INIT} />

                <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "10px", marginTop: "28px", color: "var(--text-secondary)" }}>Express Middleware</h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: 1.6 }}>
                  The middleware records latency and 5xx per route so the fingerprint has p95, not only process averages.
                </p>
                <CodeBlock code={CODE_EXPRESS} />

                <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "10px", marginTop: "28px", color: "var(--text-secondary)" }}>Logging</h3>
                <CodeBlock code={CODE_LOGS} />

                <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "10px", marginTop: "28px", color: "var(--text-secondary)" }}>Tracking Deployments</h3>
                <CodeBlock code={CODE_DEPLOY} />

                <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "10px", marginTop: "28px", color: "var(--text-secondary)" }}>Graceful Shutdown</h3>
                <CodeBlock code={CODE_SHUTDOWN} />
              </Section>

              <Section id="api" title="API Reference">
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: 1.6 }}>
                  All endpoints are on your Keo server. Dashboard calls use a user JWT; SDK calls use a service-scoped API key — both passed as <InlineCode>Authorization: Bearer &lt;token&gt;</InlineCode>.
                </p>
                <Table
                  headers={["Method", "Endpoint", "Auth", "Description"]}
                  rows={[
                    ["POST", "/api/auth/register", "None", "Register a new account"],
                    ["POST", "/api/auth/login", "None", "Login and receive a JWT token"],
                    ["GET", "/api/services", "JWT", "List all services owned by the user"],
                    ["POST", "/api/services", "JWT", "Create a new service"],
                    ["POST", "/api/services/:id/api-key", "JWT", "Generate an SDK API key for a service"],
                    ["GET", "/api/agent/fingerprint", "SDK key / JWT", "Production route fingerprint (p95 / errors)"],
                    ["POST", "/api/agent/would-this-regress", "SDK key / JWT", "Compare observed runtime or a job to the fingerprint"],
                    ["POST", "/api/metrics", "SDK key", "Ingest a metrics snapshot (includes routes)"],
                    ["GET", "/api/logs/:serviceId", "JWT", "Get log entries for a service"],
                    ["POST", "/api/logs", "SDK key / JWT", "Ingest a log entry"],
                    ["GET", "/api/deployments/:serviceId", "JWT", "Get deployment history for a service"],
                    ["POST", "/api/deployments", "SDK key / JWT", "Record a deployment event"],
                    ["GET", "/api/insights/:serviceId", "JWT", "Get AI-generated insights for a service"],
                    ["GET", "/api/dashboard/verifications", "JWT", "List PR scores for the signed-in user"],
                    ["GET", "/api/dashboard/verifications/:jobId", "JWT", "Load a PR report for the dashboard"],
                    ["POST", "/api/verifications", "Verification token", "Create a PR scoring job from GitHub Actions"],
                    ["POST", "/api/verifications/:jobId/complete", "Verification token", "Close the PR telemetry window"],
                    ["GET", "/api/verifications/:jobId", "Verification token", "Poll job status and report from CI"],
                  ]}
                />
              </Section>

              <Section id="dashboard" title="Dashboard Guide">
                {[
                  { title: "Fingerprint", desc: "Home. 14-day production contract: process averages plus per-route p95 and error rate." },
                  { title: "GitHub checks", desc: "PR jobs: 0–100 score, verdict, comparison table, findings. This is the score UI." },
                  { title: "Applications", desc: "Register the app. Copy service ID and API key for prod SDK and GitHub secrets." },
                  { title: "Docs", desc: "Fingerprint flow first, then GitHub check flow. SDK is the sensor." },
                ].map((item) => (
                  <div key={item.title} style={{ display: "flex", gap: "16px", marginBottom: "16px", background: "var(--hover-fill)", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ width: "6px", borderRadius: "4px", background: "linear-gradient(180deg,#8b5cf6,#3b82f6)", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>{item.title}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </Section>

              <Section id="integration" title="Full Integration Example">
                <div style={{ background: "rgba(46,200,133,0.06)", border: "1px solid rgba(46,200,133,0.2)", borderRadius: "8px", padding: "14px 18px", marginBottom: "20px", fontSize: "13px", color: "var(--accent-green)", lineHeight: 1.6 }}>
                  This is production fingerprint setup. GitHub scoring still needs the workflow and workers — see GitHub checks above.
                </div>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
                  Required environment variables:
                </p>
                <CodeBlock code={`KEO_API_KEY=<your-service-api-key>\nKEO_SERVICE_ID=<your-service-uuid>\nKEO_BASE_URL=<keo-server-url>`} language="bash" />
                <CodeBlock code={CODE_FULL} />
              </Section>
            </main>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
