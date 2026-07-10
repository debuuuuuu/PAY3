# Pay3 Smart Account (Soroban Vault)

Session-authorized USDC vault. Owner deposits funds; AI session keys call `transfer` within on-chain limits.

## Prerequisites

- [Rust](https://rustup.rs/)
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) (`stellar`)

## Build & test

```bash
cd contracts/smart-account
cargo test
stellar contract build
```

WASM output: `target/wasm32-unknown-unknown/release/pay3_smart_account.wasm`

## Deploy (testnet)

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/pay3_smart_account.wasm \
  --source <YOUR_SECRET_OR_ALIAS> \
  --network testnet
```

Initialize with owner + USDC SAC contract ID:

```bash
stellar contract invoke \
  --id <VAULT_CONTRACT_ID> \
  --source <OWNER> \
  --network testnet \
  -- \
  initialize \
  --owner <OWNER_G_ADDRESS> \
  --usdc_token <USDC_SAC_CONTRACT_ID>
```

Set in repo root `.env`:

```
SOROBAN_SMART_ACCOUNT_CONTRACT_ID=<VAULT_CONTRACT_ID>
STELLAR_USDC_SAC_CONTRACT_ID=<USDC_SAC_CONTRACT_ID>
```

## Deposit

```bash
stellar contract invoke \
  --id <VAULT_CONTRACT_ID> \
  --source <OWNER> \
  --network testnet \
  -- \
  deposit \
  --from <OWNER_G_ADDRESS> \
  --amount 1000000000
```

(Amount is 7-decimal: `1000000000` = 100 USDC.)

## Add AI session (after Pay3 creates session pubkey)

```bash
stellar contract invoke \
  --id <VAULT_CONTRACT_ID> \
  --source <OWNER> \
  --network testnet \
  -- \
  add_session \
  --session <SESSION_G_ADDRESS> \
  --expires_at <UNIX_TS> \
  --per_tx_max 200000000 \
  --daily_max 1000000000
```
