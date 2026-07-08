export const NAV_LINKS = [
  { label: "Features", href: "#features", external: false },
  { label: "Official X", href: "https://x.com/pay3", external: true },
  { label: "Pay3 for Business", href: "#how-it-works", external: false },
] as const;

export const TECH_STACK = [
  "Stellar",
  "Soroban",
  "MCP",
  "Next.js",
  "TypeScript",
  "Fastify",
  "PostgreSQL",
  "Prisma",
  "Redis",
  "Blend",
  "Phoenix",
  "Aquarius",
] as const;

export const STORY_SECTIONS = [
  {
    id: "mcp",
    eyebrow: "01 — The Bridge",
    title: "Give Your AI Financial Superpowers",
    body: "Pay3 exposes wallet, DeFi, and payment tools through an MCP server — so Claude, ChatGPT, Cursor, and Gemini can act on your behalf without ever touching your private key.",
    cta: "Explore MCP Tools",
    screen: "mcp" as const,
  },
  {
    id: "session-keys",
    eyebrow: "02 — Delegated Trust",
    title: "Permissions Without Private Keys",
    body: "Soroban session keys grant AI assistants temporary, scoped authority. Set duration, spend caps, daily budgets, and allowed protocols — then revoke anytime.",
    cta: "See Session Keys",
    screen: "policy" as const,
  },
  {
    id: "policy",
    eyebrow: "03 — Guardrails",
    title: "Every Transaction Passes the Policy Engine",
    body: "Daily budgets, per-tx limits, allowed smart contracts, blocked actions — nothing executes until every rule passes. The AI proposes; your policy decides.",
    cta: "Review Policies",
    screen: "policy-check" as const,
  },
  {
    id: "defi",
    eyebrow: "04 — DeFi Native",
    title: "Curated Protocols on Stellar",
    body: "Blend for lending, Phoenix for swaps, Aquarius for liquidity — your AI can supply, borrow, rebalance, and claim rewards across integrated protocols.",
    cta: "Explore Products",
    screen: "defi" as const,
  },
  {
    id: "payments",
    eyebrow: "05 — Real Commerce",
    title: "Autonomous Merchant Payments",
    body: "From restaurant supply orders to API subscriptions — AI validates policy, executes USDC transfers on Stellar, and settles in seconds with near-zero fees.",
    cta: "Explore Payments",
    screen: "payments" as const,
  },
  {
    id: "network",
    eyebrow: "06 — Agent Network",
    title: "Built for Multi-Agent Workflows",
    body: "Run Claude for payments, Cursor for development, custom agents for procurement — all connected to the same policy engine and Stellar wallet infrastructure.",
    cta: "Start Building",
    screen: "network" as const,
  },
] as const;

export const FLOW_STEPS = [
  { label: "You", sub: "Natural language command" },
  { label: "AI Assistant", sub: "Calls Pay3 MCP tool" },
  { label: "Policy Engine", sub: "Validates every rule" },
  { label: "Session Key", sub: "Scoped authorization" },
  { label: "Stellar", sub: "Transaction settles" },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    badge: "Under 1 min",
    title: "Connect your AI client to the Pay3 MCP server",
    description: "Add Pay3 to Claude Desktop, Cursor, or any MCP-compatible assistant in under a minute.",
    screen: "config" as const,
  },
  {
    step: "02",
    title: "Define your policy and issue session keys",
    description: "Set spending limits, allowed protocols, and session duration. Your wallet stays yours — always.",
    screen: "policy-setup" as const,
  },
  {
    step: "03",
    title: "Your AI is ready to manage finance on Stellar",
    description: "Transfer, swap, lend, borrow, and pay merchants — all within the boundaries you programmed.",
    screen: "ready" as const,
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: "What is Pay3?",
    a: "Pay3 is an MCP-powered AI financial operating system on Stellar. It lets AI agents securely manage wallets, interact with DeFi, and make autonomous payments using Soroban session keys and programmable policies — without ever accessing your private key.",
  },
  {
    q: "How does Pay3 work?",
    a: "You connect an MCP-compatible AI assistant to Pay3, define policies and session keys, then issue natural-language commands. The AI calls Pay3 tools, every action passes through the policy engine, and approved transactions execute on the Stellar network.",
  },
  {
    q: "What wallets are supported?",
    a: "Pay3 integrates with Stellar wallets you already control. The MCP server operates on delegated session keys — your private key never leaves your wallet or secure enclave.",
  },
  {
    q: "What are the fees?",
    a: "Stellar's sub-cent fees make AI micro-transactions economically viable — frequent rebalancing, auto-compounding, and small recurring payments all become practical.",
  },
  {
    q: "Which AI assistants are supported?",
    a: "Any MCP-compatible client works: Claude Desktop, ChatGPT, Cursor, Gemini, and custom agents built with the official MCP TypeScript SDK.",
  },
  {
    q: "What DeFi protocols are integrated?",
    a: "Blend (lending/borrowing), Phoenix (token swaps), and Aquarius (liquidity management) — with more Stellar ecosystem integrations on the roadmap.",
  },
] as const;

export const EXAMPLE_COMMANDS = [
  '"Claude, pay 5 USDC to John."',
  '"Swap 100 XLM to USDC."',
  '"Invest idle USDC in the highest yield."',
  '"Rebalance my portfolio."',
] as const;
