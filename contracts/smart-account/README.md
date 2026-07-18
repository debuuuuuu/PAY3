# Pay3 Smart Account (Soroban) — Phase 9c

> Validation: [`docs/TECHNICAL_VALIDATION.md`](../../docs/TECHNICAL_VALIDATION.md)  
> Build/install: [`docs/SOROBAN_SETUP.md`](../../docs/SOROBAN_SETUP.md)

## Status

| Item | Status |
|------|--------|
| `__constructor` + owner admin auth + SAC caps | ✅ |
| Rust tests (15) | ✅ |
| WASM (`wasm32v1-none`) | ✅ `artifacts/pay3_smart_account.wasm` |
| JS auth interop + RPC/relayer primitives | ✅ `@pay3/stellar` |
| API custody branch + on-chain session UX | ✅ opt-in |
| Default for new users | ❌ still legacy G-account |
| Broad migration / mainnet | ❌ deferred |

## Build

```bash
cd contracts/smart-account
cargo test
stellar contract build
```

## Canary

See `docs/SOROBAN_SETUP.md` and `scripts/canary-deploy.mjs`.
