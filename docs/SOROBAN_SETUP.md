# Soroban setup (Windows) — Phase 9b

Pay3’s contract lives in `contracts/smart-account/`. This machine may not have Rust yet; install once, then build.

## 1. Install Rust

```powershell
winget install Rustlang.Rustup
# restart the terminal
rustup target add wasm32-unknown-unknown
```

## 2. Install Stellar CLI

Prefer the **release binary** (faster than `cargo install`):

```powershell
# download from https://github.com/stellar/stellar-cli/releases
# e.g. stellar-cli-*-x86_64-pc-windows-msvc.tar.gz → extract stellar.exe into %USERPROFILE%\.cargo\bin
stellar version
```

Or: `cargo install --locked stellar-cli` (slow; needs a working `rust-std`).

Also add the WASM target Soroban uses:

```powershell
rustup target add wasm32v1-none
```

## 3. Build the Pay3 account contract

```powershell
cd C:\coding\PAy3-deb\contracts\smart-account
stellar contract build
# copy WASM from the build output path, or use artifacts/ after a local copy
```

A built artifact may be checked in at `contracts/smart-account/artifacts/pay3_smart_account.wasm`.

## 4. Deploy (testnet) — after build works

```powershell
stellar contract deploy `
  --wasm target/wasm32-unknown-unknown/release/pay3_smart_account.wasm `
  --source-account <YOUR_SECRET_OR_ALIAS> `
  --network testnet
```

Then call `init` with the Freighter account’s ed25519 public key (32-byte raw), register sessions with `add_session`, and set `SmartAccount.contractRef` in Neon to the returned `C…` id.

## 5. API cutover (not done yet)

Until deploy + client auth wiring land:

- Keep using the **interim G-address** allocation account  
- See `docs/TECHNICAL_VALIDATION.md` §3 D1 for migration order

## Contract surface

| Method | Who | Purpose |
|--------|-----|---------|
| `init(owner_pk)` | deployer | Set Freighter owner key |
| `add_session(pk, expires_ledger, per_tx_max_stroops)` | owner auth | Register AI session |
| `revoke_session(pk)` | owner auth | Kill session on-chain |
| `get_session(pk)` | anyone | Read policy |
| `__check_auth` | Soroban host | Owner or session ed25519 |

Do not invent alternate auth — this matches `CustomAccountInterface` / simple_account patterns.
