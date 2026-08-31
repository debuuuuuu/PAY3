# Pay3 System Architecture Specification

> **Status:** Production Architecture (Stellar) + Proposed Target Architecture (Multi-Chain & Algorand)  
> **Tagline:** Delegate. Validate. Execute.  
> **Positioning:** The security layer between AI and money.

---

## 1. Architectural Overview

Pay3 provides the mission-critical security and payment infrastructure for autonomous AI agents. Rather than providing models with unrestricted access to primary wallet private keys, Pay3 introduces an **isolated AI spending account (the AI Jar)** combined with a **hard off-chain and on-chain policy enforcement engine** and a **chain-agnostic payment routing core**.

AI agents connect via the **Model Context Protocol (MCP)** using scoped, revocable session credentials. Every requested financial action is intercepted, resolved against user preferences, validated against strict policy constraints, and routed to the appropriate blockchain adapter for execution.

---

## 2. High-Level System Architecture Diagram

```
                              AI AGENT (Cursor / Claude / MCP Client)
                                                 │
                                           MCP Connection
                                        (stdio or Streamable HTTP)
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          PAY3 CORE                                          │
│                                                                                             │
│   ┌────────────────────────┐      ┌────────────────────────┐      ┌──────────────────────┐  │
│   │     Session Manager    │      │      Policy Engine     │      │ Preference Resolver  │  │
│   │ • Scoped session auth  │      │ • AUTO / APPROVE / REJ │      │ • Explicit chain     │  │
│   │ • Action allowlists    │      │ • Token-denom limits   │      │ • Asset preference   │  │
│   │ • Expiry & revocation  │      │ • Daily budget checks  │      │ • Global default     │  │
│   └────────────────────────┘      └────────────────────────┘      └──────────────────────┘  │
│   ┌────────────────────────┐      ┌────────────────────────┐      ┌──────────────────────┐  │
│   │   Recipient Resolver   │      │   Idempotency Engine   │      │ Audit & Analytics    │  │
│   │ • Address format check │      │ • Replay protection    │      │ • Immutable logs     │  │
│   │ • Contact book lookup  │      │ • Safe technical retry │      │ • Usage tracking     │  │
│   │ • Disambiguation gate  │      │ • Hard financial stop  │      │ • Proof receipts     │  │
│   └────────────────────────┘      └────────────────────────┘      └──────────────────────┘  │
│                                                                                             │
│                                      Payment Router                                         │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       │                                               │
              Native Payment Path                             x402 Payment Path
                       │                                               │
                       │                                     Facilitator Interface
                       │                                               │
                       │                                     GoPlausible Facilitator
                       │                                               │
                       └───────────────────────┬───────────────────────┘
                                               │
                                 Common Chain Adapter Interface
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       │                                               │
             Stellar Chain Adapter                           Algorand Chain Adapter
        (Horizon / Soroban RPC / SAC)                   (Algod / Indexer / Mainnet ASAs)
                       │                                               │
                       ▼                                               ▼
             Stellar Public Mainnet                          Algorand Public Mainnet
```

---

## 3. Core Component Breakdown

### 3.1 Session Manager (`@pay3/session-manager`)
- **Authentication**: Issues time-bound, cryptographically hashed session tokens (`pay3_...`).
- **Scoping**: Enforces allowed actions (`get_balance`, `pay`, `get_history`, `x402_fetch`), allowed chains (`stellar`, `algorand`), and allowed assets.
- **Revocation**: Users can revoke individual AI sessions or purge all active sessions immediately from the dashboard.

### 3.2 Policy Engine (`@pay3/policy-engine`)
- **Evaluation States**:
  - `AUTO_EXECUTE`: Request satisfies all limits; proceeds autonomously.
  - `PENDING_APPROVAL`: Amount exceeds autonomous threshold; paused awaiting human signature/approval.
  - `REJECTED`: Disallowed action, unapproved asset, expired session, or daily budget exceeded.
- **Precedence Hierarchy**:
  1. Explicit request context (requested action & destination)
  2. Asset-specific policy override
  3. Chain-specific policy override
  4. Global user policy
- **Invariance**: Explicit user prompts **never** bypass a stricter security policy. Limits are strictly token-denominated (no silent fiat conversion).

### 3.3 Preference Resolver & Payment Router
- **Deterministic Chain Selection**:
  1. Explicit `chain` argument in MCP call.
  2. User's asset-specific chain preference (e.g. `USDC` → `algorand`).
  3. User's global default chain preference.
  4. If unresolved: Prompt user / reject with guidance. **Never guess.**

### 3.4 Recipient Resolver (`@pay3/recipient-resolver`)
- **Address Validation**:
  - Stellar: 56-character Ed25519 public keys (`G...`).
  - Algorand: 58-character Base32 checksummed addresses.
- **Contact Resolution**: Resolves human-friendly names (e.g., `"Hurain"`) to verified addresses. If 0 or 2+ matches exist, the operation halts immediately.

### 3.5 Idempotency & Transaction Engine (`@pay3/transaction-engine`)
- **Replay Protection**: Maps client-provided `idempotencyKey` to database transaction records. Duplicate submissions return the existing receipt without initiating new on-chain operations.
- **Retry Ceiling**: Allows a maximum of 2 technical retries for transient node communication failures. Financial failures (insufficient funds, policy rejection, invalid asset) are non-retryable.

### 3.6 Facilitator Interface & x402 Engine
- Intercepts paywalled `HTTP 402 Payment Required` responses.
- Decodes standard payment requirements (amount, asset, payTo, memo, facilitator).
- Settles payment via the target `ChainAdapter` and attaches payment proof header (`X-Payment`) on retry.
- Integrates **GoPlausible** behind the `FacilitatorInterface` for Algorand Mainnet x402 verification.

---

## 4. Custody & Key Management Architecture

```
                 User's Primary Wallet (Freighter / Pera / Defly)
                                        │
                         Manual User Funding (On-Chain)
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
       Stellar AI Spending Jar                       Algorand AI Spending Jar
      (G-address / Soroban C...)                        (58-char Address)
                 │                                             │
      AES-256-GCM Encrypted Seed                    AES-256-GCM Encrypted Mnemonic
                 │                                             │
                 └──────────────────────┬──────────────────────┘
                                        ▼
                            PostgreSQL (Neon Cloud DB)
                                        │
                            Decrypted only in backend
                           ephemeral memory at signing
                                        │
                        NEVER returned to API / AI / Web
```

1. **Primary Wallet**: Pay3 never stores, requests, or accesses primary private keys. Authentication is strictly signature-based via challenge nonces.
2. **AI Spending Jar**: An independent keypair is generated for the AI spending account. Secret keys are encrypted with AES-256-GCM using `SMART_ACCOUNT_ENCRYPTION_KEY`.
3. **No Automatic Sweep**: The AI spending jar cannot pull additional funds from the primary wallet. Funding is strictly user-initiated.

---

## 5. Monorepo Package Layout

```
pay3/
├── apps/
│   ├── web/               # Next.js 16 App Router UI & Dashboard
│   ├── api/               # Express 5 API (Auth, Sessions, Router, x402)
│   └── mcp-server/        # MCP Server (stdio & streamable HTTP tools)
├── packages/
│   ├── shared/            # Common multi-chain interfaces, constants & types
│   ├── database/          # Prisma ORM schema & Neon PostgreSQL migrations
│   ├── session-manager/   # Session token hashing, lifetime & scoping logic
│   ├── policy-engine/     # Multi-chain token-denominated policy evaluation
│   ├── recipient-resolver/# Address verification & contact disambiguation
│   ├── transaction-engine/# Lifecycle state machine & idempotency controls
│   ├── stellar/           # Stellar Mainnet Horizon & Soroban RPC adapter
│   └── algorand/          # Algorand Mainnet Algod & Indexer adapter (Target)
├── contracts/
│   └── smart-account/     # Soroban Rust Smart Account (CAP-71 __check_auth)
├── docs/                  # Comprehensive specifications & operational guides
└── scripts/               # Smoke tests, verifications & deployment tools
```
