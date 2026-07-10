const SETUP_HELP = `PAY3_MCP_AUTH_TOKEN is missing.

Get a token:
  1. Start the API: npm run dev:api
  2. Sign in and create a session: POST /api/ai-sessions
  3. Copy mcpAuthToken from the response

For local dev (npm run dev:mcp), add to the repo root .env:
  PAY3_MCP_AUTH_TOKEN=<paste-token-here>

For Claude/Cursor, put the same value in the MCP server env block instead.`;

export function requireMcpAuthToken(): string {
  const token = process.env.PAY3_MCP_AUTH_TOKEN?.trim();
  if (!token) {
    throw new Error(SETUP_HELP);
  }
  if (token.length < 16) {
    throw new Error("PAY3_MCP_AUTH_TOKEN looks invalid.");
  }
  return token;
}
