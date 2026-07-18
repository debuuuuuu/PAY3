export const GUIDE_PAGES = [
  {
    href: "/guide/getting-started",
    title: "Getting started",
    description:
      "Connect Freighter, fund your allocation pot, add a contact, and create an AI session.",
  },
  {
    href: "/guide/cursor-mcp",
    title: "Cursor MCP setup",
    description:
      "Paste your token into Cursor with the hosted MCP URL — no repo clone required.",
  },
  {
    href: "/guide/safety",
    title: "Safety & limits",
    description:
      "What Pay3 never holds, how revoke works, approvals, and testnet-only scope.",
  },
] as const;

export const GETTING_STARTED_STEPS = [
  {
    title: "Connect Freighter",
    body: "Open the dashboard and connect Freighter on Stellar testnet. Your primary wallet key stays in Freighter — Pay3 never stores it.",
  },
  {
    title: "Link your allocation pot",
    body: "Pay3 creates a separate allocation account (the “pot”). Only funds here are available to AI sessions.",
  },
  {
    title: "Fund with testnet XLM",
    body: "Send a small amount of testnet XLM into the allocation account. Friendbot or any testnet faucet works for the pot’s G-address.",
  },
  {
    title: "Add a contact",
    body: "Save a name and Stellar G-address (for example Hurain). When the AI says “pay Hurain,” Pay3 resolves that name. Ambiguous names are rejected — never guessed.",
  },
  {
    title: "Create an AI session",
    body: "Set duration, daily budget, per-tx max, and approval threshold. Review allowed and blocked actions, then sign with Freighter. Copy the MCP token — it is shown only once.",
  },
  {
    title: "Connect Cursor and pay",
    body: "Follow the Cursor MCP guide, then ask Cursor to check your balance or send a small payment to a saved contact.",
  },
] as const;

export const CURSOR_MCP_STEPS = [
  {
    title: "Copy your session token",
    body: "Create an AI session in the dashboard and copy the MCP token (shown once). Use a token from the same environment you will call (production dashboard → production API).",
  },
  {
    title: "Point Cursor at the hosted MCP URL",
    body: "Create or edit .cursor/mcp.json with the hosted config below — no repo clone or npm install required. Paste your token into the Authorization header.",
  },
  {
    title: "Enable tools in Cursor",
    body: "Open Cursor Settings → Tools & MCP. Find pay3, toggle it on, and confirm get_balance, transfer, and get_transaction_history appear. Reload the window if needed.",
  },
] as const;

export const MCP_JSON_EXAMPLE = `{
  "mcpServers": {
    "pay3": {
      "url": "https://pay3-api.vercel.app/mcp",
      "headers": {
        "Authorization": "Bearer pay3_PASTE_YOUR_TOKEN_HERE"
      }
    }
  }
}`;

export const MCP_LOCAL_JSON_EXAMPLE = `{
  "mcpServers": {
    "pay3": {
      "command": "node",
      "args": ["\${workspaceFolder}/apps/mcp-server/dist/index.js"],
      "env": {
        "PAY3_API_URL": "http://localhost:4000",
        "PAY3_MCP_TOKEN": "pay3_PASTE_YOUR_TOKEN_HERE"
      }
    }
  }
}`;

export const MCP_EXAMPLE_PROMPTS = [
  "What’s my Pay3 balance?",
  "Pay 0.5 XLM to Hurain",
  "Show my recent Pay3 transactions",
] as const;

export const SAFETY_POINTS = [
  {
    title: "Primary key never leaves Freighter",
    body: "Sign-in and session authorization use Freighter. Pay3 does not store your main wallet private key.",
  },
  {
    title: "AI spends only from the allocation pot",
    body: "Session keys and MCP tokens cannot drain your main Freighter balance. Fund the pot deliberately.",
  },
  {
    title: "Policy before every payment",
    body: "Off-chain policy checks session status, budgets, per-tx caps, and contacts. Over the approval threshold → you must approve in the dashboard.",
  },
  {
    title: "Ambiguous contacts are rejected",
    body: "If a name maps to more than one address, the transfer fails and the AI must ask for clarification.",
  },
  {
    title: "Revoke anytime",
    body: "Revoke one session or all sessions in the dashboard. MCP tokens stop working immediately.",
  },
  {
    title: "Testnet beta",
    body: "Public beta uses Stellar testnet XLM. Mainnet, USDC, and DeFi are later milestones — do not send real mainnet funds expecting Pay3 to manage them yet.",
  },
] as const;
