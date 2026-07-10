# Pay3

**The autonomous payment layer for the AI economy.**

Pay3 is a Stellar-native payment infrastructure that enables autonomous AI agents to securely discover, purchase, and consume paid digital services without human intervention. By providing programmable wallets, policy-controlled spending, and seamless micropayments via the **x402 protocol**, Pay3 removes the friction of human-centric billing.

## Why Pay3?

Today's payment and authentication systems are designed exclusively for humans. Modern AI agents cannot independently participate in the digital economy because they cannot own wallets, autonomously purchase APIs, enforce spending limits, or cryptographically verify payments.

Current systems rely on credit cards, static API keys, monthly SaaS subscriptions, and manual human approval. **These models do not scale to autonomous software agents.** Pay3 solves this by introducing a machine-native payment infrastructure.

## Mission

**Build the financial infrastructure that enables AI agents to become autonomous economic participants.**

Every AI agent should be able to:
* **Own** assets (via Stellar keypairs).
* **Spend** assets (via x402 micropayments).
* **Earn** assets (by providing services/tools).
* **Verify** transactions (cryptographic proof of payment).
* **Discover** paid tools (via the API/MCP Marketplace).
* **Obey** programmable financial policies (budgets, allowlists).

## Target Audience
- **AI Agents (Primary Consumers):** Personal assistants, coding agents, research bots, workflow automations.
- **Developers & AI Builders:** Seeking SDKs, APIs, wallet management tools, and sandbox environments.
- **API & MCP Server Providers:** Looking for easy monetization, usage tracking, and revenue management.
- **Enterprises:** Requiring organization-level wallets, strict spending controls, compliance, and audit logs.

## Technology Stack

- **Blockchain Layer:** [Stellar Network](https://stellar.org/) (Public/Testnet) for fast (3-5s), low-cost settlement and native multi-asset support.
- **Payment Protocol:** x402 (`HTTP 402 Payment Required`) for stateless API payments and machine-to-machine transactions.
- **AI & Integration Layer:** MCP (Model Context Protocol) compatible, designed for LangChain, AutoGen, CrewAI, etc.

## How It Works (x402 Payment Flow)

1. **Request:** AI Agent makes an HTTP Request (No Auth) to an API/MCP Server.
2. **Challenge:** Server returns `HTTP 402 Payment Required` (Price, Asset, Memo).
3. **Payment:** Agent requests payment execution via the Pay3 SDK.
4. **Settlement:** SDK signs & submits the transaction to the Stellar Network.
5. **Confirmation:** Stellar confirms the transaction, SDK returns the Payment Proof (x402 Token) to the Agent.
6. **Access:** Agent resends the HTTP Request with the x402 Payment Proof.
7. **Verification:** Server verifies the transaction on Stellar and delivers the resource.

## Core Features
- **Identity & Wallets:** Agent identity generation (Stellar keypairs) and multi-asset wallet tracking.
- **Payments & x402:** Automated challenge/response handling and cryptographic receipt verification.
- **Policy & Budget Management:** Hard/soft spending limits, domain allowlists, and human-in-the-loop workflows.
- **API & MCP Marketplace:** Discovery of paid tools and standardized pricing metadata.
- **Dashboard & Analytics:** Real-time wallet overview, cost attribution, and provider revenue analytics.

## Documentation

For more in-depth architectural and product context, please refer to our single source of truth: [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md).

## Local development (backend + dashboard)

```bash
cp .env.example .env   # fill DATABASE_URL, AUTH_SESSION_SECRET, SESSION_KEY_ENCRYPTION_KEY
npm install
npm run db:push
npm run dev:api        # http://localhost:3001
npm run dev            # http://localhost:3000 — landing + /login + /dashboard
npm run test:backend
```

Soroban vault: see [contracts/smart-account/README.md](contracts/smart-account/README.md). End-to-end smoke steps: [apps/api/README.md](apps/api/README.md).
