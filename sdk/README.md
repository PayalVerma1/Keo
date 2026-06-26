# @keo/monitor-sdk

The official SDK for integrating any service with the **Keo** observability platform.

Instead of writing raw HTTP requests everywhere, just install this package and call three lines of code.

---

## Installation

```bash
npm install @keo/monitor-sdk
# or
yarn add @keo/monitor-sdk
```

---

## Quick Start

```ts
import { Monitor } from "@keo/monitor-sdk";

const monitor = new Monitor({
  apiKey:    "YOUR_API_KEY",      // from Keo Dashboard → Settings → API Keys
  serviceId: "YOUR_SERVICE_ID",   // from Keo Dashboard → Services → [Your Service]
  baseUrl:   "https://your-keo-instance.com",
});

// Start auto-collecting system metrics every 30s
monitor.start();

// Graceful shutdown (flush pending logs, stop timers)
process.on("SIGTERM", () => monitor.shutdown().then(() => process.exit(0)));
```

---

## Features

### 📊 Metrics — Auto or Manual

**Auto (Node.js):** CPU + heap memory are sampled automatically at the configured interval.  
**Manual:** Send any metrics snapshot at any time.

```ts
// Auto — starts after monitor.start()
// Configures interval via metricsInterval option (default: 30s)

// Manual snapshot
await monitor.metrics.send({
  cpu:        45.2,   // CPU %
  memory:     62.1,   // Heap %
  throughput: 320,    // req / interval
  latency:    84,     // avg ms
  errors:     3,
});
```

### 📝 Logs — Buffered & Batched

Logs are buffered client-side and sent in batches for efficiency.

```ts
monitor.log.info("User signed in");
monitor.log.warn("Rate limit approaching");
monitor.log.error("Payment gateway timed out");
monitor.log.debug("Cache miss for key user:42");

// Force-flush the buffer right now
await monitor.log.flush();
```

### 🚀 Deployments

Call this from your CI pipeline or app startup:

```ts
await monitor.deployments.track("v2.4.1");
// or use a git SHA:
await monitor.deployments.track(process.env.GIT_SHA ?? "unknown");
```

### 🔌 Middleware (Express / Fastify)

Automatically measures latency, counts requests, and logs 5xx errors:

```ts
import express from "express";

const app = express();
app.use(monitor.middleware()); // ← single line
```

### ⚡ Next.js Route Wrapper

Wrap any App Router handler for automatic instrumentation:

```ts
// app/api/orders/route.ts
import { monitor } from "@/lib/monitor"; // your singleton

export const GET = monitor.wrapHandler(async (req) => {
  const orders = await db.orders.findMany();
  return Response.json(orders);
});
```

---

## Configuration

| Option             | Type    | Default                   | Description                                      |
|--------------------|---------|---------------------------|--------------------------------------------------|
| `apiKey`           | string  | **required**              | JWT API key from Keo Dashboard                  |
| `serviceId`        | string  | **required**              | Service ID from Keo Dashboard                   |
| `baseUrl`          | string  | `http://localhost:3000`   | Base URL of your Keo backend                    |
| `metricsInterval`  | number  | `30000`                   | Auto-metric flush interval in ms (0 = disabled) |
| `logBatchSize`     | number  | `10`                      | Logs buffered before auto-flush                 |
| `logFlushInterval` | number  | `5000`                    | Max ms before logs are force-flushed            |
| `silent`           | boolean | `false`                   | Suppress all SDK console output                 |

---

## Singleton Pattern (Recommended)

Create one shared instance per service:

```ts
// lib/monitor.ts
import { Monitor } from "@keo/monitor-sdk";

export const monitor = new Monitor({
  apiKey:    process.env.KEO_API_KEY!,
  serviceId: process.env.KEO_SERVICE_ID!,
  baseUrl:   process.env.KEO_BASE_URL ?? "http://localhost:3000",
}).start();
```

Then import `monitor` anywhere in your codebase.

---

## Complete Example — Express App

```ts
import express from "express";
import { Monitor } from "@keo/monitor-sdk";

const monitor = new Monitor({
  apiKey:           process.env.KEO_API_KEY!,
  serviceId:        process.env.KEO_SERVICE_ID!,
  baseUrl:          process.env.KEO_BASE_URL!,
  metricsInterval:  15_000,
  logBatchSize:     20,
}).start();

// Record the deployment
await monitor.deployments.track(process.env.npm_package_version ?? "unknown");

const app = express();
app.use(express.json());
app.use(monitor.middleware()); // ← all latency / error tracking

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/orders", async (req, res) => {
  try {
    const order = await createOrder(req.body);
    monitor.log.info(`Order ${order.id} created`);
    res.status(201).json(order);
  } catch (err) {
    monitor.log.error(err as Error);
    res.status(500).json({ message: "Internal error" });
  }
});

app.listen(3001, () => monitor.log.info("API server on :3001"));

// Graceful shutdown
process.on("SIGTERM", async () => {
  await monitor.shutdown();
  process.exit(0);
});
```

---

## License

MIT © Keo Platform
