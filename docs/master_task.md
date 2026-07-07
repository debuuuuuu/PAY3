# Pay3 — Master Task Roadmap

> **Read [`docs/PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) first.** This file is the ordered work plan for Phase 1 MVP.
>
> **Version:** 1.0 | **Last Updated:** July 2026

---

## Conflict Protocol

- If implementation conflicts with `PROJECT_CONTEXT.md` → **stop and flag the conflict**; do not silently deviate.
- If a task here conflicts with `PROJECT_CONTEXT.md` → **PROJECT_CONTEXT wins**.
- If the vision intentionally changes → update `PROJECT_CONTEXT.md` first, then this file, then code.

---

## Phase 1 — MVP

Ordered tasks derived from [PROJECT_CONTEXT §11](PROJECT_CONTEXT.md#11-mvp-scope-phase-1). Work top-down; mark complete as shipped.

### 1. Project Scaffolding
- [ ] Monorepo layout (backend, frontend, SDKs, docs)
- [ ] Environment config (.env.example, secrets handling per §10)
- [ ] CI stub (lint + test on PR)

**Acceptance:** Repo structure matches modular separation in [§7.2](PROJECT_CONTEXT.md#72-core-components).

### 2. REST API Skeleton + OpenAPI Schema
- [ ] OpenAPI spec for core domain entities ([§8](PROJECT_CONTEXT.md#8-core-domain-entities))
- [ ] API server scaffold with health check

**Acceptance:** Schema defined before implementation ([§13 #3](PROJECT_CONTEXT.md#13-engineering-principles)).

### 3. User/Agent Authentication
- [ ] Human user auth (org owner)
- [ ] Agent identity linked to Stellar public key ([§5](PROJECT_CONTEXT.md#5-glossary-of-core-terms))

**Acceptance:** Agents and users can be created and authenticated via REST API.

### 4. Wallet Service
- [ ] Stellar testnet account creation
- [ ] Keypair encryption at rest (AES-256, no plaintext keys — [§10](PROJECT_CONTEXT.md#10-security--non-functional-requirements))
- [ ] Funding flow + balance tracking

**Acceptance:** Wallet created, funded on testnet, balance queryable via API.

### 5. Payment Engine (x402)
- [ ] 402 challenge generation (price, asset, memo)
- [ ] Payment proof / receipt generation
- [ ] On-chain verification (tx hash + memo)

**Acceptance:** End-to-end flow per [§7.1 sequence diagram](PROJECT_CONTEXT.md#71-system-interaction-flow-x402-payment).

### 6. Policy Engine
- [ ] Hard daily spend limits
- [ ] Domain allowlists
- [ ] Policy decision audit log

**Acceptance:** Transactions blocked when policy violated; decisions logged ([§10](PROJECT_CONTEXT.md#10-security--non-functional-requirements)).

### 7. Human Dashboard
- [ ] Wallet overview (balances, agents)
- [ ] Transaction history

**Acceptance:** Human can view wallets and past transactions without using the SDK.

### 8. Agent SDKs
- [ ] TypeScript SDK (x402 payment flow, policy-aware)
- [ ] Python SDK (same surface)

**Acceptance:** Agent can complete x402 payment in < 5 min integration ([§13 #5](PROJECT_CONTEXT.md#13-engineering-principles)).

### 9. Developer Documentation
- [ ] Quickstart guides (TS + Python)
- [ ] API reference (from OpenAPI)
- [ ] x402 integration guide for API providers

**Acceptance:** New developer can run a test payment following docs alone.

---

*Phase 2+ scope lives in [PROJECT_CONTEXT §12](PROJECT_CONTEXT.md#12-future-vision-phase-2--beyond). Do not implement unless explicitly requested.*
