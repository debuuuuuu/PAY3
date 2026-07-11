import type { NextConfig } from "next";

const apiOrigin = process.env.API_PROXY_ORIGIN ?? "http://localhost:4000";

// Only proxy Pay3 API routes — ignore browser-extension /api/ext/* noise.
const nextConfig: NextConfig = {
  transpilePackages: ["@pay3/shared", "@pay3/stellar"],
  async rewrites() {
    const routes = [
      "auth",
      "smart-account",
      "history",
      "contacts",
      "sessions",
      "policy",
      "transactions",
      "approvals",
      "audit",
      "usage",
      "mcp",
      "health",
    ];
    return routes.map((route) => ({
      source: `/api/${route}/:path*`,
      destination: `${apiOrigin}/${route}/:path*`,
    })).concat(
      routes.map((route) => ({
        source: `/api/${route}`,
        destination: `${apiOrigin}/${route}`,
      }))
    );
  },
};

export default nextConfig;
