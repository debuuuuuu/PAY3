# Pay3 MCP Connection & Setup Specification

> **Status:** Production Setup (Stellar) & Target Multi-Chain MCP Specification (Algorand & x402)  
> **Protocol:** Model Context Protocol (MCP v1.18.0)  
> **Supported Clients:** Cursor, Claude Desktop, Anthropic Claude, custom MCP agents

---

## 1. Model Context Protocol (MCP) in Pay3

Pay3 uses the **Model Context Protocol (MCP)** as the standard, secure bridge between AI reasoning engines and financial execution. 

Instead of embedding custom blockchain libraries or raw private keys into AI prompts, the AI is equipped with Pay3 MCP tools. The AI submits high-level intents (e.g. `pay(recipient="Alice", amount="10", asset="USDC")`), while Pay3 enforces policy, manages sessions, signs transactions, and broadcasts to the appropriate blockchain.

---

## 2. Proposed Target Unified MCP Tool Contract

To prevent confusion and tool proliferation, Pay3 exposes a **unified multi-chain MCP interface**:

```typescript
// 1. Unified Payment Tool
pay({
  recipient: string;        // Contact name ("Alice") or valid address (G... / 58-char Algorand)
  amount: string;           // Decimal amount e.g. "5.00"
  asset: string;            // Asset symbol e.g. "USDC", "ALGO", "XLM"
  chain?: "algorand" | "stellar"; // Optional explicit chain (defaults to preference hierarchy)
  idempotency_key?: string; // Optional deduplication key to prevent double execution
})

// 2. Unified Multi-Chain Balance Tool
get_balance({
  chain?: "algorand" | "stellar"; // Optional chain filter (omitted = multi-chain summary)
  asset?: string;                 // Optional asset filter (e.g. "USDC")
})

// 3. Unified Transaction History Tool
get_history({
  chain?: "algorand" | "stellar"; // Optional chain filter
  limit?: number;                 // Maximum records to return (default 20, max 100)
})

// 4. Automatic x402 HTTP Resource Fetch Tool
x402_fetch({
  url: string;                    // Target paywalled URL
  max_amount?: string;            // Maximum authorized amount to pay upon 402 challenge
  chain?: "algorand" | "stellar"; // Optional preferred settlement chain
  idempotency_key?: string;       // Replay prevention key
})

// 5. DeFi Swap Tools (Stellar Mainnet / Soroswap)
get_swap_quote({
  asset_in: string;               // Source asset ("XLM", "USDC", contract ID)
  asset_out: string;              // Target asset ("USDC", "XLM", contract ID)
  amount: string;                 // Amount to swap
  trade_type?: "EXACT_IN" | "EXACT_OUT";
})

execute_swap({
  asset_in: string;
  asset_out: string;
  amount: string;
  trade_type?: "EXACT_IN" | "EXACT_OUT";
  slippage_bps?: number;          // Max slippage (default 50 = 0.5%)
  idempotency_key?: string;
})
```

---

## 3. Client Configuration Guides

### 3.1 Cursor (Hosted Remote MCP — Recommended)

1. Generate a session token on the dashboard ([paythreewallet.vercel.app](https://paythreewallet.vercel.app)).
2. Configure `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "pay3": {
      "url": "https://pay3-api.vercel.app/mcp",
      "headers": {
        "Authorization": "Bearer pay3_YOUR_SESSION_TOKEN_HERE"
      }
    }
  }
}
```

### 3.2 Cursor / Claude Desktop (Local Stdio)

For local development or when connecting directly to a local development API:

```json
{
  "mcpServers": {
    "pay3": {
      "command": "node",
      "args": ["${workspaceFolder}/apps/mcp-server/dist/index.js"],
      "env": {
        "PAY3_API_URL": "http://localhost:4000",
        "PAY3_MCP_TOKEN": "pay3_YOUR_SESSION_TOKEN_HERE"
      }
    }
  }
}
```

### 3.3 Claude Desktop Configuration Path
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

---

## 4. Session Scoping & Security Rules

1. **One-Time Token Disclosure**: The plaintext bearer token (`pay3_...`) is displayed **once** at creation. The backend database retains only the `SHA-256` hash.
2. **Instant Revocation**: Revoking a session in the dashboard invalidates the token hash immediately; subsequent tool calls return `HTTP 403 Forbidden`.
3. **Multi-Chain Action Scoping**: Sessions can be restricted to read-only actions (`get_balance`, `get_history`), specific chains (`allowedChains: ["algorand"]`), or specific assets (`allowedAssets: ["USDC"]`).
4. **Zero Key Exposure**: Session tokens authorize policy evaluations; they do not contain, wrap, or grant access to raw private keys.
