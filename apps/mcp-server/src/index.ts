#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { bootstrapEnvFiles } from "@pay3/shared";
import { connectDatabase, disconnectDatabase } from "@pay3/database";
import { requireMcpAuthToken } from "./auth.js";
import { getConfig } from "./config/index.js";
import { createMcpRuntime } from "./runtime.js";
import { registerPay3Tools } from "./tools/index.js";

bootstrapEnvFiles();

const config = getConfig();

let mcpToken: string;
try {
  mcpToken = requireMcpAuthToken();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
const runtime = createMcpRuntime(config);

const server = new McpServer({
  name: "pay3",
  version: "0.1.0",
});

registerPay3Tools(server, runtime, mcpToken);

await connectDatabase();

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Pay3 MCP server running on stdio");

async function shutdown(signal: string): Promise<void> {
  console.error(`Received ${signal}, shutting down...`);
  await server.close();
  await disconnectDatabase();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
