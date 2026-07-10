# Pay3 MCP Setup

Connect Claude Desktop or Cursor to Pay3 using your **MCP token** (shown once when you create an AI session).

## Prerequisites

1. API running: `npm run dev:api` (port 4000)
2. Smart account linked + funded (testnet XLM)
3. Active AI session + you copied the MCP token
4. At least one **Contact** if you want to pay by name

## Install / build MCP server

From the repo root:

```bash
npm install
npm run build -w @pay3/mcp-server
```

## Claude Desktop

Edit Claude config (Windows):

`%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pay3": {
      "command": "npx",
      "args": ["tsx", "C:/coding/PAy3-deb/apps/mcp-server/src/index.ts"],
      "env": {
        "PAY3_API_URL": "http://localhost:4000",
        "PAY3_MCP_TOKEN": "pay3_PASTE_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Or use the built file:

```json
{
  "mcpServers": {
    "pay3": {
      "command": "node",
      "args": ["C:/coding/PAy3-deb/apps/mcp-server/dist/index.js"],
      "env": {
        "PAY3_API_URL": "http://localhost:4000",
        "PAY3_MCP_TOKEN": "pay3_PASTE_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

## Cursor

Cursor Settings → MCP → Add server, or project `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "pay3": {
      "command": "npx",
      "args": ["tsx", "C:/coding/PAy3-deb/apps/mcp-server/src/index.ts"],
      "env": {
        "PAY3_API_URL": "http://localhost:4000",
        "PAY3_MCP_TOKEN": "pay3_PASTE_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Use your real absolute path and token.

## Tools

| Tool | What it does |
|------|----------------|
| `get_balance` | Allocation account balances |
| `transfer` | Pay contact name or G-address (policy enforced) |
| `get_transaction_history` | Recent Pay3 + Horizon activity |

## Example prompts

- “What’s my Pay3 balance?”
- “Pay 5 XLM to Alex” (Alex must be a saved contact)
- “Show my recent Pay3 transactions”

## Security

- Token authenticates **one** AI session only
- Revoke the session in the dashboard to kill the token
- Never commit tokens to git
- Primary Freighter key is never used by MCP

## Lost token?

Create a **new session** and copy the new token. Old tokens cannot be recovered (only a hash is stored).
