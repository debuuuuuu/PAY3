<div align="center">

<img src="docs/assets/pay3-banner.png" alt="Pay3 — Delegate. Validate. Execute. The Security Layer Between AI and Money" width="100%" />

# Pay3

### Delegate. Validate. Execute.

**The security and payment infrastructure for AI agents across multiple blockchains.**  
Policy-gated AI finance via Model Context Protocol (MCP) without handing your primary wallet keys to an AI model.

<br/>

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  CURRENT STATUS: Stellar Mainnet (Live) • Algorand Mainnet & x402 (Target Architecture)          │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

<br/>

<a href="https://paythreewallet.vercel.app"><img src="https://img.shields.io/badge/Web-Live%20on%20Mainnet-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Web" /></a>
<a href="https://pay3-api.vercel.app/health"><img src="https://img.shields.io/badge/API-Healthy-111111?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="API" /></a>
<a href="https://stellar.org"><img src="https://img.shields.io/badge/Stellar-Public%20Mainnet%20(Live)-7D00FF?style=for-the-badge&logo=stellar&logoColor=white" alt="Stellar Live" /></a>
<a href="docs/ALGORAND_X402.md"><img src="https://img.shields.io/badge/Algorand-Mainnet%20(Target%20Spec)-000000?style=for-the-badge&logo=algorand&logoColor=white" alt="Algorand Target" /></a>
<a href="docs/ALGORAND_X402.md"><img src="https://img.shields.io/badge/x402-GoPlausible%20(Target%20Spec)-222222?style=for-the-badge" alt="x402 Target" /></a>
<a href="https://x.com/PAYThreeWallet"><img src="https://img.shields.io/badge/X-@PAYThreeWallet-000000?style=for-the-badge&logo=x&logoColor=white" alt="X / Twitter" /></a>
<a href="https://pay3.mintlify.site"><img src="https://img.shields.io/badge/Docs-pay3.mintlify.site-000000?style=for-the-badge" alt="Docs" /></a>

<br/>

<p>
  <a href="https://paythreewallet.vercel.app"><strong>Live App</strong></a>
  ·
  <a href="https://pay3-api.vercel.app/health"><strong>API Health</strong></a>
  ·
  <a href="docs/ARCHITECTURE.md"><strong>Architecture</strong></a>
  ·
  <a href="docs/MULTI_CHAIN.md"><strong>Multi-Chain Spec</strong></a>
  ·
  <a href="docs/ALGORAND_X402.md"><strong>Algorand & x402 Spec</strong></a>
  ·
  <a href="docs/SECURITY.md"><strong>Security Threat Model</strong></a>
  ·
  <a href="docs/REVENUE_MODEL.md"><strong>Revenue Model</strong></a>
  ·
  <a href="docs/MCP_SETUP.md"><strong>MCP Setup</strong></a>
  ·
  <a href="docs/STATUS_REPORT.md"><strong>Status Matrix</strong></a>
  ·
  <a href="docs/ROADMAP.md"><strong>Roadmap</strong></a>
</p>

</div>

---

<details open>
<summary><strong>Table of Contents</strong></summary>

1. [What is Pay3?](#what-is-pay3)
2. [Why Pay3 Exists](#why-pay3-exists)
3. [Architectural Comparison: Why Pay3?](#architectural-comparison-why-pay3)
4. [The AI Jar Model (Core Security Primitive)](#the-ai-jar-model-core-security-primitive)
5. [End-to-End Example: AI Agent Paying for an API](#end-to-end-example-ai-agent-paying-for-an-api)
6. [Multi-Chain Vision](#multi-chain-vision)
7. [Deterministic Chain Selection](#deterministic-chain-selection)
8. [MCP: The Unified AI Interface](#mcp-the-unified-ai-interface)
9. [x402 Protocol & GoPlausible Facilitator](#x402-protocol--goplausible-facilitator)
10. [x402 Dual Capability: Pay & Receive](#x402-dual-capability-pay--receive)
11. [Security Architecture & Permissions Boundary](#security-architecture--permissions-boundary)
12. [Security House Rules](#security-house-rules)
13. [Unknown ASA Approval Governance](#unknown-asa-approval-governance)
14. [Revenue Model & Business Architecture](#revenue-model--business-architecture)
15. [What Pay3 Does NOT Do](#what-pay3-does-not-do)
16. [Tech Stack](#tech-stack)
17. [Quick Start (Local Development)](#quick-start-local-development)
18. [Production & Mainnet Status Matrix](#production--mainnet-status-matrix)
19. [Documentation Suite](#documentation-suite)
20. [Roadmap](#roadmap)

</details>

---

## What is Pay3?

**Pay3 is the security and payment infrastructure for AI agents across multiple blockchains.**

Pay3 provides autonomous AI agents (in Cursor, Claude Desktop, or custom agent frameworks) with policy-gated access to on-chain capital via the **Model Context Protocol (MCP)**—without ever exposing the user's primary wallet private keys to an LLM.

```
                          PAY3 IN ONE SENTENCE
"Pay3 gives AI agents a dedicated spending allowance with strict,
user-controlled policy rules across Stellar and Algorand, keeping
the user's primary wallet completely isolated from the AI."
```

- **Current Live Foundation**: Deployed on **Stellar Mainnet** with SEP-53 wallet authentication, isolated G-account jar custody, off-chain 3-level policy engine, and opt-in Zipper Soroban Smart Account execution.
- **Next Production Target**: Expanding into a **Chain-Agnostic Core** with **Algorand Mainnet** settlement (native ALGO & USDC ASA `31566704`), **GoPlausible x402 facilitation**, and a unified multi-chain MCP contract.

---

## Why Pay3 Exists

AI models are increasingly tasked with autonomous workflows: booking infrastructure, calling paid data APIs, purchasing compute, and transacting with other agents. 

However, connecting an AI agent to crypto capital today presents an unacceptable tradeoff:

```
                              THE DANGEROUS STATUS QUO
┌────────────────────────┐                                            ┌────────────────────────┐
│        AI AGENT        │ ──[ Gives Private Key to LLM ]───────────► │  PRIMARY CRYPTO WALLET │
│ (Cursor, Claude, Auto) │                                            │   (User's Life Savings)│
└────────────────────────┘                                            └────────────────────────┘
                                                                                  │
                                Prompt Injection / Model Hallucination / Bug      ▼
                                                                        [ TOTAL ACCOUNT DRAIN ]
```

1. **Prompt Injections & Jailbreaks**: A compromised prompt or malicious webpage can instruct an agent to sweep its wallet.
2. **Model Hallucinations & Infinite Loops**: A buggy reasoning loop can drain thousands of dollars in unmetered micro-transactions.
3. **No Granular Delegation**: Traditional crypto wallets operate on binary trust—either you hold the private key and sign manually, or you give the bot raw signing authority.

**Pay3 solves this by acting as the security boundary between AI and money.**

---

## Architectural Comparison: Why Pay3?

| Capability | Traditional Crypto Wallet | AI Bot with Raw Keys | Pay3 Infrastructure |
| :--- | :--- | :--- | :--- |
| **Primary Wallet Key Isolation** | N/A (Manual human signing) | ❌ **No** (Key exposed to LLM) | ✅ **Yes** (Never stored or exposed) |
| **AI Operates from Isolated Jar** | ❌ No | ❌ No (Direct wallet access) | ✅ **Yes** (Dedicated allowance account) |
| **Enforced Policy Engine** | ❌ No (All-or-nothing) | ❌ No | ✅ **Yes** (AUTO / APPROVAL / REJECT) |
| **Token-Denominated Limits** | ❌ No | ❌ No | ✅ **Yes** (Per-tx & daily budget caps) |
| **Scoped & Revocable Sessions** | ❌ No | ❌ No | ✅ **Yes** (Time-bound, instant revocation)|
| **Multi-Chain Abstraction** | Varies (Manual switching) | ❌ Chain-specific scripts | ✅ **Yes** (`ChainAdapter` Core) |
| **Integrated x402 Micropayments**| ❌ No | ❌ Custom implementation | ✅ **Yes** (Client fetch + Receiving) |
| **Automatic Primary Wallet Pulls**| Depends | ⚠️ **Dangerous** (Can drain all) | 🚫 **Strictly Prohibited** (Manual only) |
| **Immutable Audit Logging** | Basic explorer history | ❌ Limited / None | ✅ **Yes** (Cryptographic event trail) |

---

## The AI Jar Model (Core Security Primitive)

The central design pattern of Pay3 is the **AI Jar**:

```
                    ┌──────────────────────────────────────────────┐
                    │    User's Primary Wallet (Freighter/Pera)    │
                    │         • Holds user's main capital          │
                    │         • Signs auth challenges only         │
                    └──────────────────────┬───────────────────────┘
                                           │
                             Manual On-Chain Funding Only
                            (User chooses amount to delegate)
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │          Dedicated AI Spending Jar           │
                    │   • Stellar G... / Algorand 58-char account  │
                    │   • Contains strictly limited balance        │
                    │   • CANNOT pull funds from primary wallet    │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │                  PAY3 CORE                   │
                    │    • Intercepts every MCP action             │
                    │    • Evaluates session scope & expiry        │
                    │    • Enforces token-denominated policy caps  │
                    │    • Prevents replay via idempotency keys    │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │         AI Agent (Cursor / Claude)           │
                    │         • Spends within authorized rules     │
                    │         • Zero access to private keys        │
                    └──────────────────────────────────────────────┘
```

- **User retains ultimate control**: The user's primary wallet is safe.
- **AI blast radius is strictly capped**: An AI can never lose more than the small balance in its dedicated jar.
- **Zero Key Exfiltration**: Private keys/mnemonics are encrypted with AES-256-GCM at rest, loaded ephemerally into backend memory only during transaction signing, and are **never** returned in API or MCP responses.

---

## End-to-End Example: AI Agent Paying for an API

Here is how an AI agent autonomously consumes a paywalled resource through Pay3 without handling raw cryptographic transactions:

```
Scenario: The user instructs Cursor or Claude:
"Analyze the data from api.marketresearch.com/report and pay up to 2 USDC if required."
```

```mermaid
sequenceDiagram
    autonumber
    actor AI as AI Agent (MCP Client)
    participant Pay3 as Pay3 Core Engine
    participant API as Paywalled API Provider
    participant Facilitator as GoPlausible / Algorand
    
    AI->>Pay3: x402_fetch(url="https://api.marketresearch.com/report", max_amount="2.00")
    Pay3->>API: HTTP GET /report (Unauthenticated)
    API-->>Pay3: HTTP 402 Payment Required (Price: 1.50 USDC, PayTo: ALGO_ADDR, Facilitator: GoPlausible)
    Note over Pay3: 1. Parse x402 challenge<br/>2. Evaluate Policy: 1.50 <= 2.00 max AND <= daily budget<br/>3. Policy Decision: AUTO_EXECUTE
    Pay3->>Facilitator: Execute 1.50 USDC ASA transfer on Algorand Mainnet
    Facilitator-->>Pay3: Settlement Confirmed (TxID: 0x7a8f...)
    Pay3->>API: HTTP GET /report + Header "X-Payment: algorand-tx=0x7a8f..."
    API->>Facilitator: Verify TxID on-chain
    Facilitator-->>API: Valid & Settled
    API-->>Pay3: HTTP 200 OK + Market Report Data
    Pay3-->>AI: Returns Report Data + Audit Receipt
```

*The AI never touches a private key, never calculates gas, and cannot exceed the configured spending ceiling.*

---

## Multi-Chain Vision

Pay3 does not require an AI agent to use chain-specific tools like `stellar_pay()` or `algorand_pay()`. 

**One unified Pay3 agent operates seamlessly across multiple blockchains:**

```
                                ONE AI AGENT
                                     │
                                     ▼
                                 PAY3 CORE
                                 /       \
                      Stellar Adapter   Algorand Adapter
                            │                  │
                      XLM  /  USDC       ALGO  /  USDC
```

> **Multi-Chain Principle**: Multi-chain capability is a core infrastructure primitive, not a separate product per blockchain. Adding a new blockchain to Pay3 expands agent capability without altering the AI-facing MCP tool contract.

---

## Deterministic Chain Selection

When an AI agent invokes `pay()`, Pay3 resolves the target blockchain using a **strict 4-tier deterministic priority**:

```
1. Explicit Chain in Request   ──► e.g. pay(..., chain="algorand") selects Algorand
               │ (if omitted)
               ▼
2. Asset-Specific Preference   ──► e.g. User preference: "USDC" defaults to Algorand
               │ (if no asset rule)
               ▼
3. Global Default Preference   ──► e.g. User global default is Stellar
               │ (if no preference)
               ▼
4. Prompt User / Reject        ──► "Ambiguous routing: please specify chain."
                                   PAY3 NEVER GUESSES A FINANCIAL PARAMETER
```

*Safety Rule: Explicit chain selection directs routing, but **never** bypasses policy limits.*

---

## MCP: The Unified AI Interface

Pay3 exposes an intentionally simple, unified toolset via the **Model Context Protocol (MCP v1.18.0)**:

### Target Unified MCP Contract

```typescript
// 1. Unified Payment Execution Tool
pay({
  recipient: string;              // Contact name ("Alice") or G... / 58-char Algorand address
  amount: string;                 // Decimal amount e.g. "5.00"
  asset: string;                  // Symbol: "USDC", "ALGO", "XLM"
  chain?: "algorand" | "stellar"; // Optional (resolved via preference hierarchy)
  idempotency_key?: string;       // Replay prevention deduplication key
})

// 2. Multi-Chain Unified Balance Tool
get_balance({
  chain?: "algorand" | "stellar"; // Optional filter (omitted = multi-chain overview)
  asset?: string;                 // Optional asset filter
})

// 3. Multi-Chain Transaction History Tool
get_history({
  chain?: "algorand" | "stellar"; // Optional chain filter
  limit?: number;                 // Maximum records (default 20)
})

// 4. Automatic x402 HTTP Resource Fetch Tool
x402_fetch({
  url: string;                    // Target paywalled URL
  max_amount?: string;            // Maximum authorized payment upon 402 challenge
  chain?: "algorand" | "stellar"; // Optional preferred settlement chain
  idempotency_key?: string;
})
```

*For complete client setup with Cursor and Claude Desktop, see [`docs/MCP_SETUP.md`](docs/MCP_SETUP.md).*

---

## x402 Protocol & GoPlausible Facilitator

Pay3 integrates the open **x402 payment standard** to allow autonomous micro-settlement for web services:

1. **Detection**: Client issues an HTTP request; receiving server responds with `HTTP 402 Payment Required`.
2. **Interpretation**: Pay3 decodes the required amount, asset, recipient `payTo`, and facilitator.
3. **Policy Gate**: Pay3 verifies the payment does not violate session scopes or token budgets.
4. **Settlement**: Pay3 executes settlement on **Algorand Mainnet** coordinated via the **GoPlausible Facilitator**.
5. **Proof Delivery**: Pay3 retries the original request with the `X-Payment: algorand-tx=<txid>` proof header.
6. **Delivery**: The paid service verifies the transaction on-chain and delivers the resource.

*Deep technical details: [`docs/ALGORAND_X402.md`](docs/ALGORAND_X402.md).*

---

## x402 Dual Capability: Pay & Receive

Pay3 provides bidirectional x402 infrastructure:

```
┌──────────────────────────────────────────────┐  ┌──────────────────────────────────────────────┐
│             PAY (Outbound Spend)             │  │            RECEIVE (Monetization)            │
├──────────────────────────────────────────────┤  ├──────────────────────────────────────────────┤
│ AI Agent needs to consume external data/API. │  │ Developer or AI Agent sells their own API.   │
│                                              │  │                                              │
│ AI ──► Pay3 ──► HTTP 402 ──► Settle ──► Data │  │ Client ──► Pay3 Endpoint ──► 402 ──► Receive │
└──────────────────────────────────────────────┘  └──────────────────────────────────────────────┘
```

- **Receiving Flow**: Pay3 services emit standard `HTTP 402` challenges, verify incoming client payment proofs automatically on Algorand Mainnet / Stellar, and serve paid responses without requiring manual human approval for every micro-transaction.

---

## Security Architecture & Permissions Boundary

```
┌───────────────────────────────────┬───────────────────────────────────┬───────────────────────────────────┐
│       WHAT THE AI CAN DO          │      WHAT THE AI CANNOT DO        │        WHAT PAY3 CONTROLS         │
├───────────────────────────────────┼───────────────────────────────────┼───────────────────────────────────┤
│ • Request payments via MCP        │ • Access primary wallet keys      │ • AI Session Lifecycles & Tokens  │
│ • Query multi-chain jar balances  │ • Bypass configured policy rules  │ • 3-Level Policy Engine Gate      │
│ • Query transaction history       │ • Increase its own budget limit   │ • Token-Denominated Spend Caps    │
│ • Access authorized x402 APIs     │ • Self-approve unknown ASAs       │ • Multi-Chain Routing & Adapters  │
│ • Operate within session duration │ • Pull funds from primary wallet  │ • Replay Protection (Idempotency) │
│ • Resolve saved contacts          │ • Silently guess ambiguous chains │ • Immutable Audit Logging & Proofs│
└───────────────────────────────────┴───────────────────────────────────┴───────────────────────────────────┘
```

---

## Security House Rules

1. **Primary wallet keys are never stored or requested.**
2. **AI spending accounts are physically separate from primary wallets.**
3. **AI accounts can never automatically pull funds from primary wallets.**
4. **Every financial operation must pass policy evaluation.**
5. **Explicit user prompts never bypass a stricter security policy.**
6. **AI sessions are time-bound, scoped, and individually revocable.**
7. **Unknown ASAs require explicit human approval (AI cannot self-approve).**
8. **All financial operations are idempotent.**
9. **Ambiguous recipients or chains are never guessed.**
10. **Financial failures are never blindly retried.**

*Threat model details: [`docs/SECURITY.md`](docs/SECURITY.md).*

---

## Unknown ASA Approval Governance

To protect users against asset phishing on Algorand:

```
AI requests spend on unknown ASA ID
               │
               ▼
   Is ASA in Approved Registry?
         /           \
    YES /             \ NO
       /               \
      ▼                 ▼
Standard Policy     Operation Paused (PENDING_APPROVAL)
  Evaluation                    │
                                ▼
                     Human Authorization Screen
                     ├─ Scope: Account-Wide OR Session-Only
                     └─ Duration: Permanent OR Expiring (e.g. 24h)
                                │
                                ▼
                     Added to Approved Registry
```

---

## Revenue Model & Business Architecture

> **Core Philosophy**: *"We don't get paid more when the AI spends more. We monetize delegated trust, agent capability, and security infrastructure—not transaction volume."*

Pay3 rejects volume take-rates (no 2-3% tax on AI payments). Furthermore, **users are never charged extra simply for enabling another blockchain.**

```
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│         STARTER          │        PRO AGENT         │       POWER BUNDLE       │
│         $0 / mo          │   $19 / mo (Proposed)    │   $49 / mo (Proposed)    │
├──────────────────────────┼──────────────────────────┼──────────────────────────┤
│ • 1 Active MCP Agent     │ • Up to 5 Active Agents  │ • Unlimited AI Agents    │
│ • $100 / mo Jar Limit    │ • $2,500 / mo Jar Limit  │ • $25,000 / mo Limit     │
│ • Stellar & Algorand     │ • Multi-Chain Routing    │ • Multi-Chain Routing    │
│ • Standard Policy Engine │ • Advanced Policy Engine │ • Custom Approval Rules  │
│ • Basic x402 Intercept   │ • Included x402 Fetch    │ • Dedicated Webhooks     │
│ • 7-Day Audit Log        │ • 90-Day Audit Log       │ • 1-Year Compliance Logs │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

- **Builder Infrastructure Tiers**: Hosted MCP endpoints, high-throughput session routing, SLAs, and enterprise dedicated VPC deployments for teams embedding Pay3.
- **x402 Monetization**: Basic x402 payments and receiving are included; premium marketplace discovery and corporate tax compliance tools provide future revenue streams.

*Full commercial specification: [`docs/REVENUE_MODEL.md`](docs/REVENUE_MODEL.md).*

---

## What Pay3 Does NOT Do

- 🚫 **Does NOT give AI unrestricted wallet access.**
- 🚫 **Does NOT expose primary wallet private keys.**
- 🚫 **Does NOT allow AI prompts to bypass security policies.**
- 🚫 **Does NOT automatically pull funds from primary wallets.**
- 🚫 **Does NOT allow AI models to self-approve unknown tokens.**
- 🚫 **Does NOT guess ambiguous recipients or blockchains.**
- 🚫 **Does NOT charge a percentage take-rate on transaction volume.**
- 🚫 **Does NOT charge users extra simply for adding another blockchain.**

---

## Tech Stack

### Current Production Stack (Live)
- **Frontend & Dashboard**: Next.js 16 (App Router), React 19, Vanilla CSS Design System.
- **Backend API**: Node.js, Express 5, TypeScript, Zod.
- **Database**: PostgreSQL (Neon Serverless), Prisma ORM.
- **AI Interface**: Model Context Protocol (`@modelcontextprotocol/sdk` v1.18.0).
- **Blockchain (Stellar)**: `@stellar/stellar-sdk` v14.0.0, Horizon API, Soroban RPC.
- **Smart Accounts**: Soroban Rust Contract (`contracts/smart-account`), CAP-71 `__check_auth`.
- **DeFi Aggregation**: Soroswap Aggregator API.

### Target Multi-Chain Stack (Specified)
- **Blockchain (Algorand)**: `algosdk` v3.7.0, Algod v2 REST, Indexer v2 REST.
- **x402 Facilitator**: GoPlausible Facilitator Interface.
- **Target Assets**: Algorand Standard Assets (Mainnet USDC ASA ID `31566704`).

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database (Neon or local instance)

### 2. Installation & Setup
```bash
git clone https://github.com/debuuuuuu/PAY3.git
cd PAY3
npm install

# Configure local environment files
cp .env.example apps/api/.env
cp .env.example apps/web/.env

# Generate Prisma client and push schema
npm run db:generate
npm run db:push
```

### 3. Run Development Servers
```bash
# Terminal 1: Run Next.js Web Dashboard
npm run dev

# Terminal 2: Run Express API Backend
npm run dev:api
```

### 4. Connect Cursor or Claude Desktop via MCP
1. Open the dashboard at `http://localhost:3000` (or `3002`), log in with Freighter.
2. Navigate to **Sessions** → **Create Session** → Copy the generated token (`pay3_...`).
3. Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "pay3": {
      "url": "http://localhost:4000/mcp",
      "headers": {
        "Authorization": "Bearer pay3_YOUR_SESSION_TOKEN_HERE"
      }
    }
  }
}
```

> *Note: Algorand Mainnet local execution will be available upon completion of Phase 2 implementation. See [`docs/ALGORAND_X402.md`](docs/ALGORAND_X402.md).*

---

## Production & Mainnet Status Matrix

| Component / Layer | Network / Protocol | Status | Verification Reference |
| :--- | :--- | :--- | :--- |
| **Web Dashboard** | Vercel Edge | **Live** | [paythreewallet.vercel.app](https://paythreewallet.vercel.app) |
| **API Orchestrator** | Vercel Serverless | **Live** | [pay3-api.vercel.app](https://pay3-api.vercel.app) |
| **API Health Check** | HTTP REST | **Healthy (200 OK)** | [pay3-api.vercel.app/health](https://pay3-api.vercel.app/health) |
| **Stellar G-Account Jar Custody** | Stellar Mainnet | **Live** | In active production |
| **Soroban Smart Account Contract** | Stellar Mainnet | **Mainnet Verified** | [`CAIIDPX4S3U7E66IAF4RHTVWBXIJOCEZC45Z546V3FLAUAYSFNOCT3OO`](https://stellar.expert/explorer/public/contract/CAIIDPX4S3U7E66IAF4RHTVWBXIJOCEZC45Z546V3FLAUAYSFNOCT3OO) |
| **Three-Level Policy Engine** | Pay3 Core | **Implemented & Tested** | In active production |
| **MCP stdio & HTTP Tools** | Cursor / Claude | **Implemented & Tested** | Tested via `npm run smoke:mcp` |
| **Soroswap DEX Swaps** | Stellar Mainnet | **Implemented & Tested** | Live quote aggregation |
| **Multi-Chain ChainAdapter Core** | Pay3 Core | **Target Specification** | Specified in [`docs/MULTI_CHAIN.md`](docs/MULTI_CHAIN.md) |
| **Algorand Mainnet Adapter** | Algorand Mainnet | **Target Specification** | Specified in [`docs/ALGORAND_X402.md`](docs/ALGORAND_X402.md) |
| **GoPlausible x402 Facilitator** | Facilitator Layer | **Target Specification** | Specified in [`docs/ALGORAND_X402.md`](docs/ALGORAND_X402.md) |
| **Unknown ASA Approval Flow** | Governance | **Target Specification** | Specified in [`docs/SECURITY.md`](docs/SECURITY.md) |
| **EVM & Solana Adapters** | EVM L2s / Solana | **Future Roadmap** | Slated for Phase 3 |

*Detailed status report: [`docs/STATUS_REPORT.md`](docs/STATUS_REPORT.md).*

---

## Documentation Suite

| Document | Purpose & Scope |
| :--- | :--- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Comprehensive System Architecture, Component Breakdown & Custody Design. |
| [`docs/MULTI_CHAIN.md`](docs/MULTI_CHAIN.md) | ChainAdapter Interface Specification, Chain Selection Hierarchy & Multi-Chain Model. |
| [`docs/ALGORAND_X402.md`](docs/ALGORAND_X402.md) | Algorand Mainnet Integration, GoPlausible Facilitator, x402 Pay/Receive Flows & ASA Governance. |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Multi-Chain Threat Model, Key Isolation, Policy Boundaries & ASA Approval Lifecycle. |
| [`docs/REVENUE_MODEL.md`](docs/REVENUE_MODEL.md) | Commercial Monetization Architecture, Pricing Tiers & Builder Infrastructure. |
| [`docs/MCP_SETUP.md`](docs/MCP_SETUP.md) | Unified MCP Tool Contract, Cursor/Claude Client Setup & Session Scoping Rules. |
| [`docs/STATUS_REPORT.md`](docs/STATUS_REPORT.md) | Plain-English Status Matrix & Honest Feature Verification Scorecard. |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Strategic Three-Phase Evolution (Foundation Live → Multi-Chain Target → Ecosystem Future). |

---

## Roadmap

- **Phase 1: Foundation (Live in Production)**: Stellar Mainnet payments, Freighter SEP-53 login, AI Jar custody, 3-level policy engine, Soroswap quotes/swaps, Cursor/Claude MCP server.
- **Phase 2: Multi-Chain & x402 (Current Target)**: `ChainAdapter` abstraction, Algorand Mainnet integration, GoPlausible x402 engine, unified MCP `pay()` tool, unknown ASA governance.
- **Phase 3: Ecosystem Scale (Future Roadmap)**: EVM L2 adapters (Base/Arbitrum), Solana adapter, agent monetization marketplace, enterprise compliance audit exports.

---

<div align="center">

### Pay3 — Delegate. Validate. Execute.
**The security layer between AI and money.**

<br/>

<a href="https://paythreewallet.vercel.app">Website</a> · <a href="https://pay3-api.vercel.app/health">API</a> · <a href="https://x.com/PAYThreeWallet">X @PAYThreeWallet</a> · <a href="mailto:pay3wallet@gmail.com">Contact</a> · <a href="https://pay3.mintlify.site">Docs</a>

</div>
