# Pay3 Algorand Mainnet & x402 Technical Specification

> **Status:** Proposed Target Specification  
> **Target Network:** Algorand Mainnet (`mainnet-v1.0`)  
> **Facilitator:** GoPlausible Facilitator Abstraction  
> **Standard Assets:** Native ALGO, Mainnet USDC (`ASA ID: 31566704`), and Approved ASAs

---

## 1. Purpose and Scope

This document defines the complete technical architecture and protocol specification for Pay3's **Algorand Mainnet integration** and **x402 payment protocol capability**.

Pay3 acts as the policy-gated security boundary between AI agents (via MCP) and on-chain capital. This integration enables:
1. Direct, policy-controlled Algorand Mainnet payments (ALGO & ASAs).
2. Automatic and direct x402 payments via the **GoPlausible facilitator**.
3. x402 monetization for Pay3-powered endpoints (receiving payments).
4. Unknown ASA discovery, scoping, and governance without letting AI self-approve assets.

---

## 2. x402 Protocol Overview

x402 is an open standard designed to revive the web's native `HTTP 402 Payment Required` status code for micro-payments, machine-to-machine APIs, and agentic commerce.

```
Client / AI Agent                      Paid API / Service               Facilitator / Chain
       │                                       │                                │
       │ 1. GET /api/resource (Unauthenticated)│                                │
       ├──────────────────────────────────────►│                                │
       │                                       │                                │
       │ 2. HTTP 402 Payment Required          │                                │
       │    (Amount, Asset, PayTo, Memo)       │                                │
       │◄──────────────────────────────────────┤                                │
       │                                       │                                │
       │ 3. Policy Evaluation & Payment Execution                               │
       ├───────────────────────────────────────────────────────────────────────►│
       │                                                                        │ (Settle / Verify)
       │ 4. Payment Proof (Transaction ID / Receipt)                            │
       │◄───────────────────────────────────────────────────────────────────────┤
       │                                       │                                │
       │ 5. GET /api/resource + Proof Header   │                                │
       │    (X-Payment: algorand-tx=<txid>)    │                                │
       ├──────────────────────────────────────►│                                │
       │                                       │ 6. Verify Proof with Node / Facilitator
       │                                       ├───────────────────────────────►│
       │                                       │◄───────────────────────────────┤
       │ 7. HTTP 200 OK + Paid Content         │                                │
       │◄──────────────────────────────────────┤                                │
```

---

## 3. Algorand Mainnet Architecture & Parameters

Pay3 targets **Algorand Mainnet** for all production settlements. Testnet is utilized strictly for automated regression testing and local simulation.

| Parameter | Mainnet Production Setting | Testnet Sandbox Setting |
| :--- | :--- | :--- |
| **Network Genesis ID** | `mainnet-v1.0` | `testnet-v1.0` |
| **Genesis Hash** | `wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1iyzknek=` | `SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOZo=` |
| **Native Currency** | ALGO (6 decimals, $10^6$ microAlgos) | ALGO |
| **USDC ASA ID** | **`31566704`** (Circle Native USDC on Algorand) | **`10458941`** |
| **Algod Public RPC** | `https://mainnet-api.algonode.cloud` | `https://testnet-api.algonode.cloud` |
| **Indexer Public RPC** | `https://mainnet-idx.algonode.cloud` | `https://testnet-idx.algonode.cloud` |
| **Block Time / Finality** | ~2.9 seconds instant deterministic finality | ~2.9 seconds |
| **Base Fee** | 0.001 ALGO (1,000 microAlgos) | 0.001 ALGO |
| **Min Balance Requirement (MBR)** | 0.1 ALGO base + 0.1 ALGO per opted-in ASA | 0.1 ALGO base + 0.1 ALGO per ASA |

---

## 4. Pay3 x402 Abstraction & Facilitator Boundary

Pay3 abstracts the complexity of x402 away from the AI agent. The AI does not need to parse raw headers, construct transactions, or manage cryptographic nonces.

### Facilitator Interface (`FacilitatorInterface`)

To prevent tight coupling to any single facilitator, GoPlausible is implemented behind a strict service contract:

```typescript
export interface X402Accept {
  scheme: "algorand" | "stellar";
  network: "mainnet" | "testnet";
  amount: string;
  asset: string;
  assetId?: number | string;
  payTo: string;
  resource?: string;
  memo?: string;
  facilitator?: string;
}

export interface VerificationResult {
  valid: boolean;
  txId: string;
  sender: string;
  receiver: string;
  amount: string;
  assetId?: number | string;
  confirmedRound?: number;
  error?: string;
}

export interface FacilitatorInterface {
  readonly id: string;
  readonly name: string;

  /** Create a compliant 402 challenge accept structure for a paywalled resource */
  createPaymentRequirement(options: {
    amount: string;
    asset: string;
    assetId?: number;
    payTo: string;
    resource: string;
    memo?: string;
  }): X402Accept;

  /** Verify that a submitted transaction proof settles the required challenge */
  verifyPayment(txId: string, requirement: X402Accept): Promise<VerificationResult>;
}
```

### GoPlausible Facilitator Implementation

The `GoPlausibleFacilitator` interacts with the Algorand Indexer and GoPlausible validation services to verify:
1. Transaction existence on Algorand Mainnet within valid round bounds.
2. Receiver matches `payTo` exactly.
3. Amount matches or exceeds requested price in microAlgos / USDC base units.
4. Asset ID matches expected ASA (e.g., `31566704` for Mainnet USDC).
5. Memo or note payload correlates to the payment session challenge.

---

## 5. End-to-End Payment Flows

### 5.1 Flow A: Automatic x402 Interception & Retry (`x402_fetch`)

When an AI agent needs to access a paid resource, it invokes `x402_fetch(url)`:

```
AI Model               MCP / Pay3 Core           Remote Paywalled API        Algorand Mainnet
   │                          │                            │                        │
   │ 1. x402_fetch(url)       │                            │                        │
   ├─────────────────────────►│                            │                        │
   │                          │ 2. HTTP GET /resource      │                        │
   │                          ├───────────────────────────►│                        │
   │                          │ 3. HTTP 402 (Accepts JSON) │                        │
   │                          │◄───────────────────────────┤                        │
   │                          │                            │                        │
   │                          │ 4. Parse x402 challenge    │                        │
   │                          │ 5. Evaluate Pay3 Policy    │                        │
   │                          │    (Within budget? Auto?)  │                        │
   │                          │ 6. Algorand Adapter Pay    │                        │
   │                          ├────────────────────────────────────────────────────►│
   │                          │ 7. Tx Confirmed (txId)     │                        │
   │                          │◄────────────────────────────────────────────────────┤
   │                          │                            │                        │
   │                          │ 8. HTTP GET + Proof Header │                        │
   │                          │    (X-Payment: algorand-tx)│                        │
   │                          ├───────────────────────────►│                        │
   │                          │ 9. HTTP 200 OK (Resource)  │                        │
   │                          │◄───────────────────────────┤                        │
   │ 10. Return Paid Content  │                            │                        │
   │◄─────────────────────────┤                            │                        │
```

### 5.2 Flow B: Direct Algorand Payment (`pay`)

For normal peer-to-peer or contact payments:
```
AI Model ──► pay(recipient="Alice", amount="10", asset="USDC", chain="algorand")
         ──► Policy Engine (Check per-tx limit & daily budget)
         ──► Recipient Resolver (Resolve 58-char address)
         ──► Algorand Adapter (Build ASA transfer, sign with encrypted AI jar key)
         ──► Algorand Mainnet broadcast & wait for confirmation
         ──► Return standardized receipt (txId, fee, block round)
```

---

## 6. x402 Receiving / Monetization Flow

Pay3 also enables developers and agents to **monetize their own endpoints** using x402 on Algorand Mainnet:

1. **Endpoint Protection**: An Express middleware or serverless handler intercepts incoming requests.
2. **Challenge Emission**: If the `X-Payment` proof header is absent, the endpoint responds with `HTTP 402`:
   ```json
   {
     "x402Version": 1,
     "error": "Payment Required",
     "accepts": [
       {
         "scheme": "algorand",
         "network": "mainnet",
         "amount": "0.50",
         "asset": "USDC",
         "assetId": 31566704,
         "payTo": "PAY3_MERCHANT_ALGORAND_MAINNET_ADDRESS",
         "resource": "/api/v1/pro-analysis",
         "memo": "pay3-order-88219",
         "facilitator": "goplausible"
       }
     ]
   }
   ```
3. **Proof Verification**: When the client submits `X-Payment: algorand-tx=<txid>`, the handler verifies the on-chain payment via `GoPlausibleFacilitator` and immediately delivers the response.

---

## 7. Unknown ASA Discovery & Approval Governance

Algorand Standard Assets include thousands of community and utility tokens. To prevent malicious drain or phishing:

```
                      AI Agent requests spend for ASA-999999
                                        │
                                        ▼
                         Is ASA in Approved Registry?
                                   /         \
                              YES /           \ NO
                                 /             \
                                ▼               ▼
                      Evaluate Standard     REJECT or Request
                        Policy Limits        Human Approval
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                             Scope Selection       Duration Selection
                             - Account-wide        - Permanent
                             - Session-only        - Expiring (e.g. 24h)
                                    │                       │
                                    └───────────┬───────────┘
                                                ▼
                                    Add to Approved Registry
```

- **AI Invariant**: AI models **cannot** self-approve unknown ASAs.
- **Approval Scoping**: Users can approve an ASA for their entire account or restrict it to a specific AI session.
- **Duration Scoping**: Approvals can be permanent or automatically expire after a set duration.

---

## 8. Idempotency and Retry Semantics

1. **Idempotency Key**: Every payment request carries an `idempotencyKey`. If a duplicate call is received, Pay3 returns the existing transaction receipt rather than submitting a second on-chain transaction.
2. **Technical Retries vs. Financial Failures**:
   - **Allowed**: Transient network timeouts or RPC node connection dropouts (maximum 2 retries).
   - **Strictly Prohibited**: Policy rejection, insufficient jar balance, expired session, invalid asset, unapproved ASA, or invalid recipient. Financial failures are hard terminal stops.

---

## 9. Mainnet Verification & Real Transaction Proof

> **Note:** During specification, placeholders are clearly indicated. Upon live execution, real Algorand Mainnet transaction hashes and explorer links are recorded.

- **Mainnet Algorand USDC Payment Transaction ID**: `[MAINNET TRANSACTION ID — TO BE VERIFIED UPON PHASE 11 EXECUTION]`
- **Mainnet Algod Settlement Round**: `[MAINNET BLOCK ROUND — TO BE VERIFIED]`
- **Mainnet Explorer URL**: `https://allo.info/tx/[MAINNET_TX_ID]`
- **Live x402 Monetized Resource**: `https://pay3-api.vercel.app/demo/x402/insight`
