export const NAV_LINKS = [
  { label: "Guide", href: "/guide", external: false },
  { label: "Features", href: "/#features", external: false },
  { label: "Docs", href: "https://pay3.mintlify.site", external: true },
  { label: "Official X", href: "https://x.com/PAYThreeWallet", external: true },
  { label: "Contact Us", href: "mailto:pay3wallet@gmail.com", external: true },
] as const;

export const TECH_GROUPS = [
  { kicker: "Assets", items: ["XLM", "USDC"] },
  { kicker: "Settlement", items: ["Stellar", "Soroban"] },
  { kicker: "Agents", items: ["MCP"] },
  { kicker: "DeFi", items: ["Blend", "Phoenix", "Aquarius"] },
] as const;

export const FEATURE_BEATS = [
  {
    kicker: "The bridge",
    title: "Your agent talks. Pay3 executes.",
    body: "Cursor, Claude, ChatGPT — they call Pay3 over MCP. You never paste a secret into the chat.",
    command: "> pay the invoice in USDC",
  },
  {
    kicker: "Any currency",
    title: "Swap BTC into USDC.",
    body: "Quote first. Same session caps. More assets reuse this path as we add them.",
    command: "> swap 0.01 BTC to USDC",
  },
  {
    kicker: "Sealed vault",
    title: "The key never leaves Freighter.",
    body: "AI spends only the jar you funded. Compromise the session — the vault still doesn’t move.",
    command: "",
  },
  {
    kicker: "Settled",
    title: "Policy held. Payment landed.",
    body: "The jar moved. Your Freighter vault did not. That’s the whole product.",
    command: "",
  },
] as const;

export const FLOW_STEPS = [
  { label: "You", sub: "Natural language command" },
  { label: "AI Assistant", sub: "Calls Pay3 MCP tool" },
  { label: "Policy Engine", sub: "Validates every rule" },
  { label: "Session Key", sub: "Scoped authorization" },
  { label: "Settle", sub: "Pays out on-chain" },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "1",
    kicker: "Wallet",
    title: "Fund the jar",
    description:
      "Connect Freighter. Only the allocation pot is spendable — your vault stays sealed.",
    screen: "config" as const,
  },
  {
    step: "2",
    kicker: "Policy",
    title: "Cap every currency",
    description:
      "Daily budget, per-tx max, and allowed assets. XLM and USDC now; more as we add them.",
    screen: "policy-setup" as const,
  },
  {
    step: "3",
    kicker: "Agent",
    title: "Pay from Cursor",
    description:
      "Ask in plain language. Policy checks the transfer. Revoke anytime from the dashboard.",
    screen: "ready" as const,
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: "What is Pay3?",
    a: "Pay3 lets an AI assistant pay from a separate allocation pot you fund — in XLM, USDC, and more currencies as we add them — under session limits you authorize in Freighter. Your primary wallet key never leaves Freighter.",
  },
  {
    q: "How does Pay3 work?",
    a: "Connect Freighter, fund the allocation account, save contacts, create an AI session, then connect Cursor with your MCP token. Natural-language commands call Pay3 tools; every transfer passes the policy engine before it settles.",
  },
  {
    q: "What wallets are supported?",
    a: "Freighter for sign-in and session authorization on Stellar testnet. Pay3 never stores your Freighter private key. AI spends use encrypted session material and the allocation pot only.",
  },
  {
    q: "What are the fees?",
    a: "Network fees are typically fractions of a cent. Pay3 itself does not charge a product fee in this beta. Only fund the allocation pot with amounts you accept spending.",
  },
  {
    q: "Which currencies can I pay with?",
    a: "XLM and USDC are live on testnet today (native send plus Soroswap when a pool exists). The product is built so more assets — and later more rails — reuse the same MCP tools and policy engine. We will not guess a currency if the command is ambiguous.",
  },
  {
    q: "Which AI assistants are supported?",
    a: "Cursor is the recommended client (local or hosted MCP). Claude Desktop can use the same stdio config. Browser claude.ai custom connectors need a hosted HTTPS MCP URL.",
  },
  {
    q: "Is DeFi / USDC live?",
    a: "Native XLM transfers are live on testnet. USDC send/swap via Soroswap works when pools exist and the session allows execute_swap. Broader DeFi and extra currencies are still expanding.",
  },
] as const;

export const EXAMPLE_COMMANDS = [
  '"What’s my Pay3 balance?"',
  '"Pay 0.5 XLM to Hurain."',
  '"Pay 5 USDC to Debjit."',
  '"Pay 0.5 XLM to Manas."',
  '"Show my recent Pay3 transactions."',
] as const;
