# Pay3 Architecture

> See `maincontext.md` §8 and §45.

## Flow

```
User (Freighter G-address)
    → Wallet signature auth (API)
    → Dashboard
    → Allocation account / Soroban smart account (limited funds)
    → AI session (encrypted session key, policy, expiry)
    → MCP server (get_balance, transfer, get_transaction_history)
    → Recipient resolver (contacts — never guess)
    → Off-chain policy engine → AUTO | APPROVAL | REJECT
    → Transaction engine (lifecycle, idempotency, smart retry)
    → On-chain Soroban validation (Phase 9)
    → Stellar testnet/mainnet
```

## Monorepo layout

| Path | Role |
|------|------|
| `apps/web` | Landing + dashboard (Next.js) |
| `apps/api` | Express API — auth, sessions, transfers |
| `packages/database` | Prisma + PostgreSQL (Neon) |
| `packages/shared` | Shared types and constants |
| `packages/stellar` | Horizon, Friendbot, balances |
| `contracts/smart-account` | Soroban Rust (later) |

## Phase 2 interim custody model (until Soroban)

**ponytail:** Full Soroban smart-account contracts are not finalized (§45). Phase 2 uses a dedicated **Stellar G-address allocation account**:

```
Freighter (user primary wallet)     ← never stored by Pay3
        ↓ user manually sends funds
Allocation account (G…)             ← created by Pay3, secret encrypted at rest
        ↓ later
AI session keys + policy            ← Phase 4+
```

| Rule | Status |
|------|--------|
| Primary private key never stored | ✅ |
| Allocation secret encrypted (AES-GCM), never in API responses | ✅ |
| Manual funding only | ✅ |
| Friendbot seeds new testnet account so it exists on-chain | ✅ |
| Soroban on-chain policy enforcement | ❌ Phase 9 |

### §45 open questions (still open)

1. Exact Soroban contract interface for session-key authorization
2. How wallet “owns” the contract vs interim G-account
3. Testnet USDC issuer + trustline UX
4. Simulate-before-submit coverage for all transfer paths

When contracts land, `SmartAccount.contractRef` becomes the contract id; `encryptedSecret` for the interim G-account can be retired or used only for migration.
