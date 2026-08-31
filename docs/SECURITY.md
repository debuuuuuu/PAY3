# Pay3 Multi-Chain Security Architecture & Threat Model

> **Status:** Production Security Standards (Stellar) & Target Multi-Chain Security Architecture (Algorand)  
> **Core Tenet:** *The user keeps the primary wallet; the AI operates strictly within a limited, policy-gated spending allowance.*

---

## 1. Security House Rules (Non-Negotiable)

```
┌────┬─────────────────────────────────────────────────────────────────────────────────────────┐
│ 🚫 │ NEVER store or request the user's primary wallet private key.                           │
│ 🚫 │ NEVER expose AI spending-jar private keys to AI models, MCP responses, or UI clients.  │
│ 🚫 │ NEVER allow an explicit user prompt to bypass a configured security policy.             │
│ 🚫 │ NEVER guess an ambiguous financial parameter (unresolved recipient, missing chain).     │
│ 🚫 │ NEVER automatically retry a financial failure (insufficient funds, policy rejection).   │
│ 🚫 │ NEVER permit an AI model to self-approve an unapproved Algorand Standard Asset (ASA).   │
│ ✅ │ ALWAYS enforce token-denominated limits (per-transaction, daily budget, approval level).│
│ ✅ │ ALWAYS ensure every AI session is temporary, scoped, and individually revocable.        │
│ ✅ │ ALWAYS guarantee payment idempotency via deduplication keys.                           │
│ ✅ │ ALWAYS isolate primary wallet capital from delegated AI spending accounts.             │
└────┴─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Threat Model & Mitigation Matrix

| Threat / Attack Vector | Attack Description | Pay3 Architectural Mitigation |
| :--- | :--- | :--- |
| **Prompt Injection / Jailbreak** | Malicious prompt instructs AI to drain wallet to attacker address. | **Hard Policy Boundary**: MCP operations pass through Pay3's backend policy engine before blockchain execution. Strict per-tx and daily budget caps prevent large drains; unknown recipients trigger human approval or rejection. |
| **Primary Key Compromise** | Attacker breaches Pay3 server and attempts to steal user's main wallet. | **Zero Knowledge of Primary Keys**: Primary wallets authenticate via cryptographic challenge signatures (SEP-53). Primary keys remain safely inside Freighter / Pera / Defly and are never held by Pay3. |
| **AI Jar Key Exfiltration** | Attacker queries MCP tools (`pay`, `get_balance`) to leak AI spending key. | **Strict Payload Sanitization**: AI private keys / mnemonics are encrypted with AES-256-GCM at rest, loaded ephemerally into backend memory only during transaction signing, and are never serialized into API responses or MCP tool results. |
| **Malicious ASA Phishing** | Attacker tricks AI into transacting a fake/malicious Algorand Standard Asset. | **Unknown ASA Governance**: ASAs not in the verified registry require explicit human approval with defined scope (account-wide vs session) and expiration. AI models cannot self-approve ASAs. |
| **Double-Spend Replay Attacks** | Network lag causes duplicate submissions of the same payment request. | **Idempotency Engine**: Every payment requires an `idempotencyKey`. Duplicate submissions return the cached transaction receipt without broadcasting new on-chain transactions. |
| **Runaway Technical Retries** | API retries a rejected transaction in a loop, exhausting transaction fees. | **Failure Partitioning**: Transient network/RPC errors permit max 2 retries. Financial errors (policy reject, bad balance, invalid asset) terminate immediately with zero retries. |
| **x402 Facilitator Spoofing** | Attacker serves a fake 402 challenge pointing to an attacker address. | **Challenge & Policy Inspection**: `x402_fetch` parses the 402 requirement and evaluates it against standard policy limits before executing any payment. Unreasonable amounts trigger hard policy rejection. |

---

## 3. Cryptographic Custody & Key Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │   User's Primary Wallet (Freighter / Pera)   │
                    │      • Holds primary capital                 │
                    │      • Signs auth challenges                 │
                    │      • Initiates manual jar funding          │
                    └──────────────────────┬───────────────────────┘
                                           │
                                Manual On-Chain Transfer
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │       Dedicated AI Spending Jar              │
                    │      • Stellar G... / Algorand 58-char       │
                    │      • Holds limited allowance               │
                    │      • Cannot pull from primary wallet       │
                    └──────────────────────┬───────────────────────┘
                                           │
                           AES-256-GCM Encrypted at Rest
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │       PostgreSQL (Neon Cloud Database)       │
                    │      • Encrypted secret blob                 │
                    │      • Initialization Vector (IV)            │
                    │      • Authentication Tag                    │
                    └──────────────────────┬───────────────────────┘
                                           │
                        Decrypted in Ephemeral Memory Only
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │           Transaction Signer Module          │
                    │      • Signs transaction payload             │
                    │      • Submits signed blob to Node RPC       │
                    │      • Key cleared from memory immediately   │
                    └──────────────────────────────────────────────┘
```

---

## 4. Policy as the Absolute Security Boundary

Pay3 enforces a strict **invariant**:

$$\text{User Explicit Intent} \neq \text{Policy Bypass}$$

If a user prompts an AI:
> *"Pay 50 USDC to Alice on Algorand immediately."*

And the user's configured policy rule is:
> *Approval required for amounts exceeding 10 USDC.*

**Pay3 Result**: `PENDING_APPROVAL`. The transaction is paused, an approval request is created in the database, and on-chain execution is blocked until the human explicitly authorizes the transaction.

### Policy Precedence:
1. **Explicit Request Context**: Identifies the intended action, asset, amount, and recipient.
2. **Asset-Specific Policy Override**: Applies specific caps (e.g., `USDC` limit).
3. **Chain-Specific Policy Override**: Applies network-specific constraints (e.g., `Algorand` limit).
4. **Global User Policy**: Fallback default constraints.

*Rule: The policy engine always applies the most restrictive applicable constraint.*

---

## 5. Unknown ASA Approval Lifecycle

```
AI requests spend on ASA-ID (e.g. 123456)
               │
               ▼
   Is ASA in Approved Registry?
         /           \
    YES /             \ NO
       /               \
      ▼                 ▼
Standard Policy     Operation Paused
  Evaluation       (PENDING_APPROVAL)
                        │
                        ▼
                 Human Review & Approval
                 ├─ Select Scope: Account-wide OR Session-only
                 └─ Select Duration: Permanent OR Expiring (e.g. 24h)
                        │
                        ▼
             Add to Approved Asset Registry
                        │
                        ▼
             Proceed to Policy Evaluation
```

---

## 6. Auditability & Immutable Event Logging

Every lifecycle event in Pay3 creates an immutable `AuditLog` entry in PostgreSQL:
- **Session Lifecycle**: Creation, scoping, expiration, and revocation events.
- **Policy Decisions**: Records exact input, policy state, decision (`AUTO_EXECUTE`, `PENDING_APPROVAL`, `REJECTED`), and reason string.
- **Transactions**: Records sender, recipient, asset, amount, chain, transaction hash, fee paid, and confirmation round/ledger.
- **Approvals**: Records human resolution timestamps and approving wallet public key.
