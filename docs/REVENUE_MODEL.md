# Pay3 Revenue Model & Business Architecture

> **Status:** Business Model & Pricing Architecture  
> **Core Philosophy:** *"We don't get paid more when the AI spends more. We monetize delegated trust, agent capability, and security infrastructure."*  
> **Notice:** Current production Pay3 is currently in free public access on Mainnet. Pricing tiers below represent the architectural monetization model for commercial rollout.

---

## 1. Product Monetization Philosophy

Traditional payment gateways take a percentage cut (2–3% take-rate) of transaction volume. **For AI safety, volume-based pricing creates perverse incentives:** it encourages the infrastructure provider to maximize spending and relax policy friction.

Pay3 rejects volume take-rates. Instead, Pay3 charges for:
1. **Delegated Spending Capacity**: The scale of responsibility and financial limits a user entrusts to their AI jar.
2. **Concurrent Agent / MCP Seats**: The number of independent AI sessions and tools connected simultaneously.
3. **Advanced Security Rules & Multi-Chain Orchestration**: Enterprise-grade policy engines, custom approvals, and compliance audit logs.
4. **Builder Infrastructure**: Hosted, highly available MCP endpoints, session management APIs, and SLAs for software teams embedding Pay3.

---

## 2. Multi-Chain Pricing Invariant

**Pay3 does not penalize users for multi-chain capabilities.** Enabling Algorand, Stellar, or future networks does not increase subscription costs. Multi-chain support is a fundamental infrastructure primitive, not a fee-gated add-on.

---

## 3. End-User Pricing Tiers (Proposed Commercial Structure)

```
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│        STARTER           │        PRO AGENT         │       POWER BUNDLE       │
│        $0 / mo           │        $19 / mo          │         $49 / mo         │
├──────────────────────────┼──────────────────────────┼──────────────────────────┤
│ • 1 Active MCP Agent     │ • Up to 5 Active Agents  │ • Unlimited AI Agents    │
│ • $100 / mo Jar Limit    │ • $2,500 / mo Jar Limit  │ • $25,000 / mo Limit     │
│ • Stellar & Algorand     │ • Multi-Chain Routing    │ • Multi-Chain Routing    │
│ • Standard Policy Engine │ • Advanced Policy Engine │ • Custom Approval Rules  │
│ • Basic x402 Intercept   │ • Included x402 Fetch    │ • Dedicated Webhooks     │
│ • 7-Day Audit Log        │ • 90-Day Audit Log       │ • 1-Year Compliance Logs │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

### End-User Add-Ons
- **Additional Autonomous Agent Seat**: +$5/mo per active MCP token.
- **Jar Capacity Expansion**: +$10/mo per additional $5,000 monthly spending limit.
- **Hardware-Enforced Approvals**: Mobile push confirmation integration (Pera / Freighter mobile).

---

## 4. Builder & Developer Infrastructure Tiers

For companies building AI applications that need embedded, policy-controlled crypto spending for their users:

| Feature | Developer (Free) | Team / Startup ($99/mo) | Enterprise ($499+/mo) |
| :--- | :--- | :--- | :--- |
| **Hosted MCP API Calls** | 1,000 calls / mo | 50,000 calls / mo | 500,000+ calls / mo |
| **Managed AI Accounts** | Up to 10 user jars | Up to 500 user jars | Unlimited user jars |
| **Supported Blockchains** | Stellar + Algorand | Stellar + Algorand + Canary | Custom Chain Adapters |
| **Session Scoping API** | Standard | Granular + Webhooks | Custom Scopes & KMS |
| **High Availability & SLA** | Community support | 99.9% Uptime SLA | 99.99% Dedicated SLA |
| **Deployment Mode** | Shared Cloud | Shared High-Throughput | Dedicated VPC / On-Prem |

---

## 5. x402 Monetization Model

### Basic x402: Included
Basic x402 client payments (`x402_fetch`) and standard receiving endpoints on Algorand Mainnet and Stellar are included in base tiers without surcharge.

### Premium x402 Value-Added Services (Roadmap):
1. **API Marketplace & Tool Discovery**: Paid indexing and discovery for monetized MCP agents and API providers.
2. **High-Throughput Settlement Routing**: Sub-second settlement batching and optimized gas routing.
3. **Enterprise Compliance & Receipts**: Automated tax accounting and cryptographic proof generation for corporate treasury audits.

---

## 6. Business Model Status

| Revenue Component | Status | Classification |
| :--- | :--- | :--- |
| **Public Mainnet Infrastructure** | Active | Free Public Mainnet Access |
| **MCP Session Token System** | Active | Free Core Capability |
| **Commercial SaaS Billing** | Planned | Commercial Rollout (Post-Audit) |
| **Builder API Tiers** | In Specification | Q4 Commercial Roadmap |
| **Enterprise Dedicated Deployments** | In Specification | Enterprise Sales Pipeline |
