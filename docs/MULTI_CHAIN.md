# Pay3 Multi-Chain Architecture Specification

> **Status:** Proposed Target Architecture  
> **Positioning:** The security and payment infrastructure for AI agents across multiple blockchains.  
> **Core Principle:** Chain-agnostic core logic; chain-specific behavior isolated in `ChainAdapter` implementations.

---

## 1. Executive Summary

Pay3 was originally established on Stellar to solve a fundamental problem: **AI agents need to spend money, but handing primary wallet private keys to an LLM is a catastrophic security risk.**

Pay3 introduced the **AI Jar model**: the user keeps their primary wallet, funds a separate, limited-balance spending account, provisions a scoped AI session token, and delegates controlled spending authority via the Model Context Protocol (MCP) while Pay3's policy engine governs every transaction before settlement.

This document specifies the **Multi-Chain Evolution of Pay3**. The core payment, session, policy, preference, and security logic becomes strictly chain-agnostic. Support for **Stellar Mainnet** remains in full production, while **Algorand Mainnet** is integrated as the next production network via a standardized `ChainAdapter` interface. Future blockchains (e.g., Base, Solana, Polygon) can be added without altering the unified MCP interface exposed to AI agents.

---

## 2. Multi-Chain Design Principles

1. **Unified AI Interface**: AI models interact with Pay3 via a single, simple MCP tool (`pay`). The AI does not manage blockchain-specific transaction serialization, gas estimation, or cryptographic signing.
2. **Chain-Agnostic Core**: The Session Manager, Permission Scopes, Policy Engine, Recipient Resolver, Preference Resolver, Payment Router, and Audit Engine operate without chain-specific branching.
3. **Isolated Chain Adapters**: Low-level blockchain mechanics (account generation, address checksums, node RPCs, transaction encoding, fee estimation, and broadcast) live entirely inside concrete `ChainAdapter` modules.
4. **No Cross-Chain Fungibility Illusion**: Balances on different blockchains are physically distinct. Pay3 presents a unified multi-chain asset view (e.g., `USDC: 100 on Algorand, 20 on Stellar`) but makes network identity explicit.
5. **Universal Policy Invariant**: Policies are evaluated across chains with strict token-denominated limits (e.g., `20 USDC`, `50 ALGO`, `100 XLM`). An explicit chain request tells Pay3 where to route the payment, but **never** bypasses policy constraints.

---

## 3. Conceptual System Architecture

```
                    AI Agent (Cursor / Claude / MCP Client)
                                       │
                                      MCP
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 PAY3 CORE                                   │
│                                                                             │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌───────────────┐  │
│  │     Session Manager    │  │      Policy Engine     │  │  Preferences  │  │
│  │ (Chain/Asset/Tool Scope│  │ (AUTO / APPROVE / REJECT│  │  (Chain/Asset │  │
│  └────────────────────────┘  └────────────────────────┘  └───────────────┘  │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌───────────────┐  │
│  │   Recipient Resolver   │  │   Idempotency Engine   │  │  Audit Log    │  │
│  │ (G-addr / 58-char B32) │  │ (Replay Prevention)    │  │  & Receipts   │  │
│  └────────────────────────┘  └────────────────────────┘  └───────────────┘  │
│                                                                             │
│                                Payment Router                               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
           Native Payment Path                     x402 Payment Path
                    │                                     │
                    │                           Facilitator Interface
                    │                                     │
                    │                           GoPlausible Facilitator
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       │
                         Common Chain Adapter Interface
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
          Stellar Chain Adapter                 Algorand Chain Adapter
       (Horizon / Soroban / SAC)              (Algod / Indexer / Mainnet ASAs)
                    │                                     │
                    ▼                                     ▼
             Stellar Mainnet                       Algorand Mainnet
```

---

## 4. The `ChainAdapter` Interface Specification

Every supported blockchain implements the standard `ChainAdapter` interface:

```typescript
export type ChainIdentifier = "stellar" | "algorand" | string;

export interface AssetMetadata {
  symbol: string;         // e.g. "USDC", "ALGO", "XLM"
  name: string;           // e.g. "USD Coin"
  decimals: number;       // e.g. 6 for USDC/ALGO, 7 for XLM
  contractOrId?: string;  // ASA ID "31566704" or SAC Address "CCW67..."
  isNative: boolean;      // true for ALGO, XLM
}

export interface ChainBalance {
  chain: ChainIdentifier;
  asset: string;
  assetId?: string;
  balance: string;        // Formatted decimal string (e.g. "15.500000")
  rawBalance: string;     // Base units (microAlgos, stroops)
}

export interface PaymentRequest {
  senderAddress: string;
  recipientAddress: string;
  amount: string;         // Decimal string e.g. "5.00"
  asset: string;          // Symbol e.g. "USDC"
  assetId?: string;       // Optional explicit ASA ID or contract ID
  memo?: string;
  idempotencyKey: string;
}

export interface PaymentReceipt {
  success: boolean;
  chain: ChainIdentifier;
  txHash: string;
  sender: string;
  recipient: string;
  amount: string;
  asset: string;
  assetId?: string;
  feePaid: string;
  blockOrLedger: number;
  confirmedAt: string;
  explorerUrl: string;
}

export interface ChainAdapter {
  readonly chain: ChainIdentifier;
  readonly network: "mainnet" | "testnet";

  /** Validate whether an address string is structurally and cryptographically valid */
  validateAddress(address: string): boolean;

  /** Resolve human-readable asset symbol to on-chain asset metadata */
  resolveAsset(symbolOrId: string): Promise<AssetMetadata | null>;

  /** Fetch live balances for an account across native and supported token balances */
  getBalance(accountAddress: string, assetFilter?: string): Promise<ChainBalance[]>;

  /** Fetch standardized payment transaction history */
  getHistory(accountAddress: string, limit?: number): Promise<PaymentReceipt[]>;

  /** Estimate network transaction fees in base units and native currency */
  estimateFee(request: PaymentRequest): Promise<{ feeUnits: string; feeFormatted: string }>;

  /** Construct, validate, sign with decrypted secret, and submit transaction on-chain */
  executePayment(request: PaymentRequest, encryptedSecret: string): Promise<PaymentReceipt>;
}
```

---

## 5. Chain Mapping: Stellar vs. Algorand

| Capability | Stellar Implementation (`@pay3/stellar`) | Algorand Implementation (`@pay3/algorand`) |
| :--- | :--- | :--- |
| **Production Network** | Public Stellar Mainnet | Algorand Mainnet (`mainnet-v1.0`) |
| **Native Asset** | XLM (7 decimals, Stroops) | ALGO (6 decimals, microAlgos) |
| **Target Stablecoin** | Native USDC SAC (`CCW67TSZV3...`) | Native USDC ASA (`ID: 31566704`, 6 decimals) |
| **Address Format** | 56-character Base32 starting with `G...` | 58-character Base32 with checksum |
| **Account Key Model** | Ed25519 Secret Seed (`S...`) | 32-byte Ed25519 Seed / 25-word BIP-39 mnemonic |
| **Custody Support** | Interim G-account + Opt-in Zipper Soroban Smart Account | Dedicated Algorand AI spending account (AES-256-GCM encrypted) |
| **Node Clients** | Horizon REST API + Soroban JSON-RPC | Algod v2 REST API + Indexer v2 REST API |
| **Public RPC Nodes** | `https://horizon.stellar.org` | `https://mainnet-api.algonode.cloud` |
| **Explorer** | `https://stellar.expert/explorer/public` | `https://allo.info` / `https://explorer.perawallet.app` |
| **x402 Facilitator** | Stellar direct transfer + payment proof | GoPlausible Facilitator (`FacilitatorInterface`) |

---

## 6. Chain Selection & Preference Hierarchy

When an AI agent invokes `pay()`, Pay3 resolves the target blockchain using a strict **4-tier deterministic priority order**:

```
                  ┌─────────────────────────────────────────┐
                  │ 1. Explicit Chain in Request            │
                  │    e.g. pay(..., chain="algorand")      │
                  └────────────────────┬────────────────────┘
                                       │ (if omitted)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 2. Asset-Specific User Preference       │
                  │    e.g. User sets USDC -> "algorand"    │
                  └────────────────────┬────────────────────┘
                                       │ (if no asset rule)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 3. Global Chain Preference              │
                  │    e.g. User default chain = "stellar"  │
                  └────────────────────┬────────────────────┘
                                       │ (if no preference)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ 4. Prompt User / Reject with Guidance   │
                  │    NEVER GUESS AN AMBIGUOUS PARAMETER   │
                  └─────────────────────────────────────────┘
```

### Safety Rule: Explicit Choice Does Not Bypass Policy
Specifying `chain="algorand"` directs routing to the Algorand Chain Adapter, but the payment must still satisfy all policy checks (per-transaction limits, daily budgets, approved asset status, and active session duration).

---

## 7. Multi-Chain Account Custody Model

```
                    User's Primary Wallet
               (Freighter / Pera / Defly / Lute)
                               │
                 Manual Funding (User-Initiated)
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
    Stellar AI Spending Jar         Algorand AI Spending Jar
      (G-address / Soroban)             (58-char Address)
               │                               │
        AES-256-GCM Secret              AES-256-GCM Secret
               │                               │
               └───────────────┬───────────────┘
                               ▼
                    Pay3 Multi-Chain Router
                               │
                     Policy & Session Check
                               │
                   Autonomous AI Spend Action
```

- **Primary Wallet Isolation**: Pay3 never stores, requests, or accesses the user's primary private key.
- **Independent AI Accounts**: Each user has isolated spending accounts per chain.
- **No Automatic Sweep/Pull**: AI accounts cannot pull funds from the primary wallet under any circumstances.
- **Secret Encryption**: Private keys and mnemonics are encrypted with AES-256-GCM using `SMART_ACCOUNT_ENCRYPTION_KEY` and are never exposed to AI models, MCP tool results, or web clients.

---

## 8. Adding Future Blockchains

To add a new blockchain (e.g., Base, Polygon, Solana):
1. Implement the `ChainAdapter` interface in `packages/<chain-name>`.
2. Register the adapter in `apps/api/src/payment-router.ts`.
3. Add address regex/validation to `@pay3/recipient-resolver`.
4. Register known token/asset identifiers.
5. **No changes required to the AI-facing MCP interface.** AI agents continue using `pay()`, `get_balance()`, and `get_history()`.
