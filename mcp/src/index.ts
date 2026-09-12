import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const apiUrl = (process.env.KEO_API_URL ?? process.env.KEO_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const apiKey = process.env.KEO_API_KEY ?? "";
const serviceId = process.env.KEO_SERVICE_ID ?? "";

const observedShape = z
  .object({
    cpu: z.number().optional(),
    memory: z.number().optional(),
    latency: z.number().optional(),
    errors: z.number().optional(),
    routes: z
      .array(
        z.object({
          method: z.string(),
          route: z.string(),
          count: z.number(),
          errors: z.number(),
          latencyP50: z.number(),
          latencyP95: z.number(),
        })
      )
      .optional(),
  })
  .optional();

async function keoFetch(path: string, init?: RequestInit) {
  if (!apiKey) {
    throw new Error("KEO_API_KEY is required. Generate one from Dashboard → Applications → API key.");
  }
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Keo ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

function asText(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

const server = new McpServer({
  name: "keo",
  version: "0.1.0",
});

server.tool(
  "get_fingerprint",
  "Load this service's production fingerprint: p95 and error rate per route over the last 14 days. Call this before editing hot paths.",
  async () => {
    const query = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : "";
    return asText(await keoFetch(`/api/agent/fingerprint${query}`));
  }
);

server.tool(
  "would_this_regress",
  "Compare observed runtime (or a Keo job) against the production fingerprint. Returns ok | warn | regress | insufficient plus structured findings with fileHint and retry so you can patch and call again.",
  {
    observed: observedShape,
    jobId: z.string().optional(),
    changedFiles: z.array(z.string()).optional(),
    diff: z.string().optional(),
    baselineServiceId: z.string().optional(),
  },
  async (args) => {
    return asText(
      await keoFetch("/api/agent/would-this-regress", {
        method: "POST",
        body: JSON.stringify({
          serviceId: serviceId || undefined,
          baselineServiceId: args.baselineServiceId,
          observed: args.observed,
          jobId: args.jobId,
          changedFiles: args.changedFiles,
          diff: args.diff,
        }),
      })
    );
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
