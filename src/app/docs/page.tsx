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
  '  baseUrl: "https://keo-five.vercel.app", // Your Keo server URL',
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

            <main className="docs-main">
              <div className="card" style={{ marginBottom: "24px", padding: "24px" }}>
                <div className="docs-chip">PR scoring</div>
                <h1 style={{ fontSize: "34px", fontWeight: 800, marginBottom: "10px", lineHeight: 1.15 }}>Score pull requests with Keo</h1>
                <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "680px" }}>
                  Install <InlineCode>@keo-platform/monitor-sdk</InlineCode> in the app GitHub Actions runs in the sandbox. Keo compares that telemetry to a production baseline and posts PASS / WARN / FAIL plus a report.
                </p>
              </div>

              {error && <div className="form-error" style={{ marginBottom: "16px" }}>{error}</div>}

              <div className="docs-stat-grid">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Applications</span>
                  </div>
                  <div className="stat-value">{loading ? "…" : applicationCount}</div>
                  <div className="stat-trend trend-up">Registered for scoring</div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">SDK</span>
                  </div>
                  <div className="stat-value">Node</div>
                  <div className="stat-trend trend-up">Sandbox telemetry</div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Verdicts</span>
                  </div>
                  <div className="stat-value">3</div>
                  <div className="stat-trend">PASS, WARN, FAIL</div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Baseline</span>
                  </div>
                  <div className="stat-value">Prod</div>
                  <div className="stat-trend">Compared per PR</div>
                </div>
              </div>

              <Section id="quickstart" title="Quick Start">
                <div className="docs-grid">
                  {[
                    { step: "1", title: "Register the app", desc: "Create a Keo account and add the application you want to score." },
                    { step: "2", title: "Install the SDK", desc: "Instrument the app so sandbox traffic emits metrics tagged with the job ID." },
                    { step: "3", title: "Wire GitHub Actions", desc: "Add the Keo workflow and secrets. Each PR gets a score and report." },
                  ].map((s) => (
                    <div key={s.step} className="docs-card">
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(165,180,252,0.15)", color: "#a5b4fc", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "15px", marginBottom: "12px" }}>{s.step}</div>
                      <div style={{ fontWeight: 600, marginBottom: "6px" }}>{s.title}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
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
                    ["baseUrl", "string", "https://keo-five.vercel.app", "Base URL of Keo server"],
                    ["metricsInterval", "number", "30000", "How often (ms) to auto-send CPU/memory metrics"],
                  ]}
                />
              </Section>

              <Section id="sdk-usage" title="SDK Usage">
                <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "10px", color: "var(--text-secondary)" }}>Initialization</h3>
                <CodeBlock code={CODE_INIT} />

                <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "10px", marginTop: "28px", color: "var(--text-secondary)" }}>Express Middleware</h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: 1.6 }}>
                  The middleware automatically tracks request count, latency, and 5xx error rate.
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
                    ["POST", "/api/metrics", "SDK key", "Ingest a metrics snapshot"],
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
                  { title: "PR scores", desc: "Home lists recent pull request jobs with score, verdict, repository, and SHA." },
                  { title: "Report", desc: "Each job has a comparison table against the production baseline, plus optional Gemini recommendations." },
                  { title: "Applications", desc: "Register the app GitHub Actions will run in the sandbox. Copy the service ID and API key for the SDK." },
                  { title: "Docs", desc: "SDK, workflow secrets, and how KEO_VERIFICATION_JOB_ID ties sandbox telemetry to a job." },
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
                  ✅ Copy the snippet below into your app entry point. Replace the environment variables and you&apos;re done.
                </div>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
                  Required environment variables:
                </p>
                <CodeBlock code={`KEO_API_KEY=<your-service-api-key>\nKEO_SERVICE_ID=<your-service-uuid>\nKEO_BASE_URL=https://keo-five.vercel.app\nGIT_SHA=v1.2.3`} language="bash" />
                <CodeBlock code={CODE_FULL} />
              </Section>
            </main>
          </div>
        </div>
      </main>
    </div>
  );
}
