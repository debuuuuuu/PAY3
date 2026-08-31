# Pay3 Product & Architecture Roadmap

> **Status:** Strategic Roadmap  
> **Core Direction:** Multi-Chain Evolution • MCP-First • x402 Settlement • Enterprise Security

---

## 1. Roadmap Overview

Pay3's journey is structured in three clear evolutionary phases:
1. **Foundation (Existing / Live)**: Proving the AI Jar model, SEP-53 wallet authentication, off-chain policy engine, and MCP tool execution on Stellar Mainnet.
2. **Multi-Chain Expansion (Current Target)**: Establishing the chain-agnostic core, integrating Algorand Mainnet, integrating x402 with GoPlausible, and unifying the MCP tool contract.
3. **Ecosystem & Enterprise Scale (Future)**: Additional L1/L2 chain adapters, agent marketplace discovery, automated tax/compliance accounting, and dedicated enterprise VPC deployments.

---

## 2. Detailed Evolutionary Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: FOUNDATION (EXISTING / LIVE ON MAINNET)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ • SEP-53 Cryptographic Wallet Login (Freighter & Mobile QR)                │
│ • Isolated AI Jar Spending Account (Stellar G-address, AES-256-GCM)         │
│ • Three-Level Policy Engine (AUTO / APPROVAL / REJECT)                      │
│ • Cursor & Claude MCP Integration via stdio and Streamable HTTP             │
│ • Contact Book & Unambiguous Recipient Resolution                          │
│ • Soroswap Aggregator DEX Quotes & Swaps (Stellar)                          │
│ • Opt-in Zipper Soroban Smart Account Custody (`contracts/smart-account`)   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: MULTI-CHAIN & x402 (CURRENT TARGET SPECIFICATION)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Chain-Agnostic Core (`ChainAdapter` Interface)                            │
│ • Algorand Mainnet Production Adapter (Native ALGO & Mainnet USDC ASA)      │
│ • Dedicated Algorand AI Account Custody & Manually Funded Jar Model         │
│ • Unified MCP Contract: `pay()`, `get_balance()`, `get_history()`           │
│ • Deterministic Chain Selection (Explicit → Asset → Global → Ask)           │
│ • x402 Client Interception & Automatic Retry (`x402_fetch`)                 │
│ • GoPlausible Facilitator Integration (`FacilitatorInterface`)              │
│ • Pay3-Powered x402 Receiving Endpoint (Monetized APIs)                     │
│ • Unknown ASA Discovery, Human Approval Scoping & Expiry Registry           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: ECOSYSTEM & ENTERPRISE SCALE (FUTURE ROADMAP)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ • EVM Chain Adapters (Base, Arbitrum, Ethereum Mainnet, Polygon)            │
│ • Solana SVM Chain Adapter (SOL & SPL Tokens)                               │
│ • AI Agent & MCP Tool Monetization Marketplace                              │
│ • Hardware-Enforced Mobile Push Approvals (Pera / Freighter Mobile)         │
│ • Corporate Treasury Sub-Accounts & Role-Based Access Control (RBAC)        │
│ • Automated Tax & Cryptographic Accounting Exports                          │
│ • High-Throughput Sub-Second Payment Channel Settlement Batching            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Milestone Classification & Honest Status

| Milestone | Target Layer | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Stellar Horizon / SAC Transfers** | Stellar Mainnet | **Live in Production** | Fully operational on mainnet |
| **Soroban Smart Account Canary** | Stellar Mainnet | **Mainnet Verified** | Deployed (`CAIID...T3OO`), opt-in |
| **Three-Level Policy Engine** | Pay3 Core | **Live in Production** | Off-chain auto/approval/reject |
| **Cursor / Claude MCP Server** | MCP Interface | **Live in Production** | stdio + hosted HTTP |
| **ChainAdapter Abstraction** | Pay3 Core | **Specified (Target)** | Formalized in `docs/MULTI_CHAIN.md` |
| **Algorand Mainnet Adapter** | Algorand Mainnet | **Specified (Target)** | Formalized in `docs/ALGORAND_X402.md` |
| **GoPlausible x402 Facilitator** | Facilitator Layer | **Specified (Target)** | Designed behind `FacilitatorInterface` |
| **Unknown ASA Approval Flow** | Governance | **Specified (Target)** | Scope & expiry approval model |
| **Multi-Chain Dashboard UI** | Web Dashboard | **Specified (Target)** | Multi-jar overview and asset table |
| **EVM Chain Adapters (Base/Arb)** | EVM L2s | **Future Roadmap** | Post-Algorand release |
| **Agent Marketplace & Discovery** | Ecosystem | **Future Roadmap** | Monetized agent registry |
