"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Menu, X, ExternalLink, Copy, CheckCircle2 } from "lucide-react";

const CODE_INIT = `import { Monitor } from "@keo/monitor-sdk";

const monitor = new Monitor({
  apiKey: "YOUR_SERVICE_API_KEY",   // Dashboard > Services > API Key
  serviceId: "YOUR_SERVICE_ID",     // Dashboard > Services > copy ID
  baseUrl: "http://localhost:3000", // Your Obsidian Labs server URL
  metricsInterval: 30000,           // Send metrics every 30 s (optional)
  logBatchSize: 10,                 // Batch size before flush  (optional)
  silent: false,                    // Suppress SDK logs        (optional)
});

// Start automatic system metrics collection
monitor.start();`;

const CODE_EXPRESS = `import express from "express";

const app = express();

// ✅ Add this middleware AFTER body parsers
app.use(monitor.middleware());

app.listen(3000, () => {
  monitor.log.info("Server running on port 3000");
});`;

const CODE_LOGS = `// Log at different levels
monitor.log.info("User authenticated successfully");
monitor.log.warn("Rate limit approaching — 80% utilised");
monitor.log.error("Database connection timeout", { host: "db-01" });
monitor.log.debug("Cache HIT for key: session:xyz");

// Logs are batched and flushed every 5 s or every 10 entries`;

const CODE_DEPLOY = `// Track a deployment when your app starts
await monitor.deployments.track("v2.1.0");

// Or use your Git SHA
await monitor.deployments.track(process.env.GIT_SHA ?? "unknown");`;

const CODE_SHUTDOWN = `// Graceful shutdown — flush all pending logs & metrics
process.on("SIGTERM", async () => {
  await monitor.shutdown();
  process.exit(0);
});`;

const CODE_FULL = `// ─── your-app/src/index.ts ───────────────────────────────────────────────────
import express from "express";
import { Monitor } from "@keo/monitor-sdk";

// 1. Initialise
const monitor = new Monitor({
  apiKey:      process.env.KEO_API_KEY!,
  serviceId:   process.env.KEO_SERVICE_ID!,
  baseUrl:     process.env.KEO_BASE_URL ?? "http://localhost:3000",
  silent:      process.env.NODE_ENV === "production",
});

// 2. Start auto metrics
monitor.start();

const app = express();
app.use(express.json());

// 3. Middleware (tracks every request automatically)
app.use(monitor.middleware());

// 4. Your routes…
app.get("/health", (_req, res) => {
  monitor.log.debug("Health check called");
  res.json({ status: "ok" });
});

app.post("/orders", async (req, res) => {
  try {
    // your logic here
    monitor.log.info(\`Order created: \${req.body.id}\`);
    res.json({ ok: true });
  } catch (err) {
    monitor.log.error(err as Error);
    res.status(500).json({ error: "internal" });
  }
});

app.listen(4000, async () => {
  monitor.log.info("App running on port 4000");
  // 5. Track the deployment
  await monitor.deployments.track(process.env.GIT_SHA ?? "v1.0.0");
});

// 6. Graceful shutdown
process.on("SIGTERM", async () => {
  await monitor.shutdown();
  process.exit(0);
});`;

function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: "relative", marginBottom: "20px" }}>
      <button onClick={copy}
        style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", color: copied ? "var(--accent-green)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", transition: "all 0.2s" }}>
        {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre style={{ background: "#111216", borderRadius: "8px", padding: "20px", overflowX: "auto", fontFamily: "monospace", fontSize: "13px", lineHeight: "1.7", border: "1px solid rgba(255,255,255,0.06)", margin: 0 }}>
        <code style={{ color: "#e2e8f0" }}>{code}</code>
      </pre>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: "56px", scrollMarginTop: "80px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "16px", color: "#f8f9fa", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 7px", borderRadius: "4px", fontSize: "13px", fontFamily: "monospace", color: "#a5b4fc" }}>
      {children}
    </code>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: "20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "rgba(255,255,255,0.04)" }}>
            {headers.map((h) => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "10px 14px", color: j === 0 ? "#a5b4fc" : "var(--text-secondary)", fontFamily: j === 0 ? "monospace" : undefined }}>
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

const TOC = [
  { id: "quickstart",   label: "Quick Start" },
  { id: "install",      label: "Installation" },
  { id: "config",       label: "Configuration" },
  { id: "sdk-usage",    label: "SDK Usage" },
  { id: "api",          label: "API Reference" },
  { id: "dashboard",    label: "Dashboard Guide" },
  { id: "integration",  label: "Full Integration" },
];

export default function DocsPage() {
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileNav(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-darker)", color: "var(--text-primary)", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Responsive styles */}
      <style>{`
        .docs-body { display: flex; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .docs-toc  { width: 220px; flex-shrink: 0; position: sticky; top: 80px; align-self: flex-start; padding: 32px 0; }
        .docs-main { flex: 1; padding: 40px 0 80px 48px; min-width: 0; }
        @media (max-width: 900px) {
          .docs-toc { display: none; }
          .docs-main { padding: 32px 0 60px 0; }
        }
        @media (max-width: 600px) {
          .docs-body { padding: 0 16px; }
          .docs-main { padding: 24px 0 40px 0; }
          .docs-nav  { padding: 0 16px; }
          .docs-qs-grid { grid-template-columns: 1fr !important; }
          .docs-config-table { font-size: 12px; }
        }
      `}</style>

      {/* Top Navbar — NOT sticky */}
      <nav style={{ background: "rgba(19,20,26,0.98)", borderBottom: "1px solid rgba(255,255,255,0.08)", height: "64px", display: "flex", alignItems: "center", padding: "0 32px", gap: "24px" }} className="docs-nav">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => router.push("/")}>
          <BrainCircuit size={22} color="#a5b4fc" />
          <span style={{ fontSize: "17px", fontWeight: 700, color: "#a5b4fc" }}>Obsidian Labs</span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "4px" }}>/ Docs</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "14px" }}>← Dashboard</button>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "14px", textDecoration: "none" }}>
          GitHub <ExternalLink size={13} />
        </a>
        <button onClick={() => setMobileNav(!mobileNav)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
          {mobileNav ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Body: TOC + Content */}
      <div className="docs-body">
        {/* Sticky TOC sidebar */}
        <aside className="docs-toc">
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>On this page</div>
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {TOC.map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                style={{ background: "none", border: "none", textAlign: "left", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)", transition: "all 0.15s" }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.target as HTMLElement).style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = ""; (e.target as HTMLElement).style.color = "var(--text-secondary)"; }}>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="docs-main">
          {/* Hero */}
          <div style={{ marginBottom: "48px" }}>
            <div style={{ display: "inline-block", background: "rgba(165,180,252,0.1)", border: "1px solid rgba(165,180,252,0.2)", color: "#a5b4fc", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>
              Developer Documentation
            </div>
            <h1 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "12px", lineHeight: 1.2 }}>Obsidian Labs SDK</h1>
            <p style={{ fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "600px" }}>
              The <InlineCode>@keo/monitor-sdk</InlineCode> lets you instrument any Node.js app in minutes —
              metrics, logs, and deployments automatically flow into your observability dashboard.
            </p>
          </div>

          {/* Quick Start */}
          <Section id="quickstart" title="Quick Start">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }} className="docs-qs-grid">
              {[
                { step: "1", title: "Register", desc: "Create an account on the dashboard and verify your email." },
                { step: "2", title: "Create a Service", desc: "Go to Services → New Service. Copy your Service ID." },
                { step: "3", title: "Add the SDK", desc: "Install the SDK, add 3 lines to your app entry point." },
              ].map((s) => (
                <div key={s.step} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "20px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(165,180,252,0.15)", color: "#a5b4fc", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "15px", marginBottom: "12px" }}>{s.step}</div>
                  <div style={{ fontWeight: 600, marginBottom: "6px" }}>{s.title}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Installation */}
          <Section id="install" title="Installation">
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
              Install via your preferred package manager:
            </p>
            <CodeBlock code={`# npm
npm install @keo/monitor-sdk

# yarn
yarn add @keo/monitor-sdk

# pnpm
pnpm add @keo/monitor-sdk`} language="bash" />
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Requires Node.js 18+ · TypeScript 5+ (types included)
            </p>
          </Section>

          {/* Configuration */}
          <Section id="config" title="Configuration">
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
              Pass a <InlineCode>MonitorConfig</InlineCode> object to the <InlineCode>Monitor</InlineCode> constructor:
            </p>
            <Table
              headers={["Option", "Type", "Default", "Description"]}
              rows={[
                ["apiKey",           "string",  "required",  "Service-scoped API key from Dashboard → Profile → API Keys"],
                ["serviceId",        "string",  "required",  "UUID of your service (Dashboard → Services)"],
                ["baseUrl",          "string",  "http://localhost:3000", "Base URL of your Obsidian Labs server"],
                ["metricsInterval",  "number",  "30000",     "How often (ms) to auto-send CPU/memory metrics"],
                ["logBatchSize",     "number",  "10",        "Number of logs to collect before flushing"],
                ["logFlushInterval", "number",  "5000",      "Max ms to wait before flushing logs"],
                ["silent",           "boolean", "false",     "Suppress SDK console output (set true in production)"],
              ]}
            />
          </Section>

          {/* SDK Usage */}
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

          {/* API Reference */}
          <Section id="api" title="API Reference">
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: 1.6 }}>
              All endpoints are on your Obsidian Labs server. Dashboard calls use a user JWT; SDK calls use a service-scoped API key — both passed as <InlineCode>Authorization: Bearer &lt;token&gt;</InlineCode>.
            </p>
            <Table
              headers={["Method", "Endpoint", "Auth", "Description"]}
              rows={[
                ["POST", "/api/auth/register", "None", "Register a new account"],
                ["POST", "/api/auth/login",    "None", "Login and receive a JWT token"],
                ["GET",  "/api/auth/me",       "JWT",  "Get current user profile"],
                ["PATCH","/api/auth/me",       "JWT",  "Update display name"],
                ["GET",  "/api/services",      "JWT",  "List all services owned by the user"],
                ["POST", "/api/services",      "JWT",  "Create a new service"],
                ["POST", "/api/services/:id/api-key", "JWT", "Generate an SDK API key for a service"],
                ["GET",  "/api/services/:id/metrics", "JWT", "Get metric history for a service"],
                ["POST", "/api/metrics",       "SDK key", "Ingest a metrics snapshot (CPU, memory, latency, etc.)"],
                ["GET",  "/api/logs/:serviceId","JWT", "Get log entries for a service"],
                ["POST", "/api/logs",          "SDK key / JWT", "Ingest a log entry"],
                ["GET",  "/api/deployments/:serviceId", "JWT", "Get deployment history for a service"],
                ["POST", "/api/deployments",   "SDK key / JWT", "Record a deployment event"],
                ["GET",  "/api/insights/:serviceId", "JWT", "Get AI-generated insights for a service"],
                ["GET",  "/api/dashboard/metrics", "JWT", "Aggregate metrics across all services"],
              ]}
            />
          </Section>

          {/* Dashboard Guide */}
          <Section id="dashboard" title="Dashboard Guide">
            {[
              { title: "Overview",    desc: "Aggregate view across all your services — CPU, memory, latency, error rate charts, and top AI alerts." },
              { title: "Services",    desc: "Create and manage services. Each service represents a single microservice or application you instrument." },
              { title: "Logs",        desc: "Stream logs from all services. Filter by level (info/warn/error/debug) or by service. Export to .txt." },
              { title: "Deployments", desc: "Chronological list of version releases. Correlate deployments with metric changes in the Service detail view." },
              { title: "AI Insights", desc: "Gemini-powered anomaly detection. Insights are generated automatically when metrics breach thresholds (CPU > 85%, latency spike, etc.)." },
              { title: "Profile",     desc: "Update your name, view account stats, generate service-scoped API keys for the SDK, and manage security settings." },
            ].map((item) => (
              <div key={item.title} style={{ display: "flex", gap: "16px", marginBottom: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", padding: "16px" }}>
                <div style={{ width: "6px", borderRadius: "4px", background: "linear-gradient(180deg,#8b5cf6,#3b82f6)", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>{item.title}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </Section>

          {/* Full Integration */}
          <Section id="integration" title="Full Integration Example">
            <div style={{ background: "rgba(46,200,133,0.06)", border: "1px solid rgba(46,200,133,0.2)", borderRadius: "8px", padding: "14px 18px", marginBottom: "20px", fontSize: "13px", color: "var(--accent-green)", lineHeight: 1.6 }}>
              ✅ Copy the snippet below into your app entry point. Replace the environment variables and you&apos;re done.
            </div>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
              Required environment variables:
            </p>
            <CodeBlock code={`KEO_API_KEY=<your-service-api-key>      # Dashboard → Profile → API Keys
KEO_SERVICE_ID=<your-service-uuid>    # Dashboard → Services → copy ID
KEO_BASE_URL=http://localhost:3000    # Your Obsidian Labs server
GIT_SHA=v1.2.3                        # Optional: passed to deployments`} language="bash" />
            <CodeBlock code={CODE_FULL} />
          </Section>
        </main>
      </div>
    </div>
  );
}
