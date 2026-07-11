# Pay3 Smart Account (Soroban) — Phase 9b

> Validation: [`docs/TECHNICAL_VALIDATION.md`](../../docs/TECHNICAL_VALIDATION.md)  
> Build/install: [`docs/SOROBAN_SETUP.md`](../../docs/SOROBAN_SETUP.md)

## Status

| Item | Status |
|------|--------|
| Contract source (`init`, sessions, `__check_auth`) | ✅ |
| Rust + Stellar CLI | ✅ Installed on this machine |
| Local WASM build | ✅ `artifacts/pay3_smart_account.wasm` (~4KB) |
| Testnet deploy | ❌ |
| API wired to `C…` contract | ❌ (still interim G-account) |

## Build

```bash
# after docs/SOROBAN_SETUP.md
cd contracts/smart-account
stellar contract build
```

## Interim custody

Production/demo path remains the encrypted **G-address** until this contract is deployed and the transaction engine signs with session auth entries.
