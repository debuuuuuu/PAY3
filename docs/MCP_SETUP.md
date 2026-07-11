# Pay3 MCP Setup (local)

Connect **Cursor** or **Claude Desktop** to Pay3. This is a **local stdio** MCP server talking to your local API.

## What works / what does not

| Client | Works? | How |
|--------|--------|-----|
| Cursor | Yes | `.cursor/mcp.json` |
| Claude Desktop (Windows app) | Yes | `%APPDATA%\Claude\claude_desktop_config.json` |
| claude.ai browser “Add custom connector” | No | That UI wants an **https://** remote MCP URL. We only ship local stdio for now. |

## Prerequisites

1. API running: `npm run dev:api` (port 4000)
2. Web running (optional for MCP): `npm run dev` (port 3000)
3. Smart account linked + funded (testnet XLM)
4. Active AI session + MCP token from dashboard (shown once)
5. At least one **Contact** if you want to pay by name
6. MCP server built once: `npm run build:mcp`

## Quick smoke test (no AI client)

```powershell
cd C:\coding\PAy3-deb
$env:PAY3_MCP_TOKEN="pay3_YOUR_TOKEN_HERE"
npm run smoke:mcp
```

You should see `SMOKE OK`.

## Cursor

```powershell
copy .cursor\mcp.json.example .cursor\mcp.json
```

Edit `.cursor/mcp.json` — replace `PAY3_MCP_TOKEN`. File is gitignored.

Preferred config (uses built `dist`, reliable on Windows):

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

Then open **Cursor Settings → Tools & MCP**:

1. Find **pay3** in the list  
2. Toggle it **on** if it shows disabled / needs approval  
3. Confirm it shows tools (get_balance, transfer, get_transaction_history) — not an error  
4. If missing: **Reload Window** (Command Palette → “Developer: Reload Window”) or fully restart Cursor  

Keep `npm run dev:api` running while you use Pay3 tools.

## Claude Desktop

1. Install/open Claude Desktop so `%APPDATA%\Claude` exists.
2. Create/edit `%APPDATA%\Claude\claude_desktop_config.json` with the **same JSON** as above.
3. Fully quit Claude Desktop and reopen.
4. Keep `npm run dev:api` running.

Dev alternative (tsx, no build):

```json
{
  "mcpServers": {
    "pay3": {
      "command": "node",
      "args": [
        "C:/coding/PAy3-deb/node_modules/tsx/dist/cli.mjs",
        "C:/coding/PAy3-deb/apps/mcp-server/src/index.ts"
      ],
      "env": {
        "PAY3_API_URL": "http://localhost:4000",
        "PAY3_MCP_TOKEN": "pay3_PASTE_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

## Tools

| Tool | What it does |
|------|----------------|
| `get_balance` | Allocation account balances |
| `transfer` | Pay contact name or G-address (policy enforced) |
| `get_transaction_history` | Recent Pay3 + Horizon activity |

## Example prompts

- “What’s my Pay3 balance?”
- “Pay 0.5 XLM to debu” (must be a saved contact)
- “Show my recent Pay3 transactions”

## Security

- Token authenticates **one** AI session only
- Revoke the session in the dashboard to kill the token
- Never commit tokens to git (`.cursor/mcp.json` is ignored)
- Primary Freighter key is never used by MCP

## Lost token?

Create a **new session** and copy the new token. Old tokens cannot be recovered (only a hash is stored).
