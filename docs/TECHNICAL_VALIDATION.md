# Technical Validation — Soroban Smart Account (§45)

> **Status:** Research spike complete (Phase 9 start).  
> **Rule:** Do not implement production on-chain enforcement until this doc’s decisions are accepted.  
> **Spec source:** `maincontext.md` §11, §20, §45.

---

## 1. Product model (unchanged)

```
Freighter G-wallet (owner)     ← never stored by Pay3
        ↓ owns / controls
Soroban smart account (C…)     ← holds allocated funds
        ↓ restricted session signer
AI session key (backend only)
        ↓
Off-chain policy → on-chain __check_auth hard limits → Stellar
```

Interim MVP (live today): **encrypted G-address allocation account**. That remains valid until a contract is deployed and funded.

---

## 2. Protocol findings (validated against current Soroban docs)

| Assumption | Verdict | Source |
|------------|---------|--------|
| Smart accounts can be **contract accounts** implementing custom auth | ✅ Supported | [Soroban Authorization](https://developers.stellar.org/docs/learn/fundamentals/contract-development/authorization) |
| Host calls `__check_auth` when `require_auth` hits the contract `Address` | ✅ Supported | Same + [complex-account example](https://developers.stellar.org/docs/build/smart-contracts/example-contracts/complex-account) |
| Session keys + spend limits belong **inside** `__check_auth` / policies | ✅ Fits product | [Stellar composable auth](https://stellar.org/blog/foundation-news/stellars-composable-auth-model) |
| Production-ready smart-account frameworks exist | ✅ Prefer reuse | [OpenZeppelin stellar-contracts accounts](https://github.com/OpenZeppelin/stellar-contracts/tree/main/packages/accounts) |
| Freighter “owns” contract like a classic account out of the box | ⚠️ Partial | Owner is an `Address` (G or C). Admin ops use `require_auth` on owner. Wallet UX for contract accounts is still maturing. |
| Client simulation / Freighter signing for full custom-account flows | ⚠️ Maturing | Stellar docs note client support still evolving for some account-contract paths |
| Native USDC in contract balance | ⚠️ Separate | Needs SAC / trustline model; MVP stays **XLM** until USDC path is designed |

**Conclusion:** The product architecture is **protocol-compatible**. Pay3 should **not** invent a novel auth framework — use Soroban `CustomAccountInterface` and strongly consider OpenZeppelin accounts + policies for session rules / spend limits.

---

## 3. Decisions for Pay3 Phase 9

### D1 — Custody migration
1. Keep interim G-account until contract is deployed on **testnet**.  
2. `SmartAccount.contractRef` ← contract id (`C…`).  
3. User funds contract (manual, same as today).  
4. Stop using `encryptedSecret` for new spends once contract path is default; migrate or drain old G-account under user control.

### D2 — What on-chain must enforce (non-bypassable)
From `maincontext.md` §20 — implement in `__check_auth` / policies:

- Session validity + expiration  
- Session revocation flag  
- Hard per-tx / period spend caps  
- Allowed invocation targets (e.g. only native/SAC transfer helpers)  
- Cryptographic verification of the **session** ed25519 key (not the Freighter primary key)

### D3 — What stays off-chain
Recipient name resolution, ambiguous-contact rejection, approval UX, rate limits, risk heuristics, MCP auth — already in API / policy engine.

### D4 — Implementation approach (ordered)
1. Spike: compile + deploy **simple account** example on Futurenet/Testnet.  
2. Extend with session signer + spend limit (complex-account pattern or OZ policies).  
3. Wire `packages/stellar` to build auth entries signed by session key.  
4. Dual-run: off-chain policy still required; on-chain is the hard gate.  
5. Only then flip dashboard “smart account” to contract id.

---

## 4. Open items (block full cutover)

1. Exact Freighter UX for authorizing **admin** session registration on the contract.  
2. Testnet USDC SAC address + trustline / wrap flow.  
3. Fee bump / sponsorship if session key has no XLM for fees.  
4. Formal threat model: compromised Pay3 API with session key vs without on-chain caps.

---

## 5. Scaffold location

See [`contracts/smart-account/`](../contracts/smart-account/) — placeholder interface + README. **Not deployed. Not wired to the API yet.**
