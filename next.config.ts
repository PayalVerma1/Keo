import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the Turbopack root to this app's directory (avoids pnpm-lock.yaml detection warning)
  turbopack: {
    root: __dirname,
  },

  // Mark heavy server-only packages as external so Next.js doesn't try to bundle them
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "bcrypt",
    "socket.io",
    "redis",
  ],
};

export default nextConfig;
