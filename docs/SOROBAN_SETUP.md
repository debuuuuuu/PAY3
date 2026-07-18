# Soroban setup — Phase 9c

Pay3’s contract lives in `contracts/smart-account/`. Build target is **`wasm32v1-none`**.

## 1. Tooling

```powershell
# Rust + WASM target
rustup target add wasm32v1-none
# Stellar CLI on PATH (e.g. %USERPROFILE%\.cargo\bin)
stellar version
```

## 2. Build + test

```powershell
cd contracts/smart-account
cargo test
stellar contract build
# Artifact: artifacts/pay3_smart_account.wasm (copy from CLI output if needed)
```

Exported methods: `__constructor`, `__check_auth`, `add_session`, `revoke_session`, `get_session`, `owner`, `native_sac`.

**WASM SHA-256 (phase9c-v1):** `3adb17764399dac1725b5a50073bd671de498645387a10505d6e1245fab48a5b`  
Optional: set `PAY3_ALLOWED_WASM_HASHES` to this value so enable-contract-custody rejects unknown builds.

## 3. Contract surface (Phase 9c)

| Method | Who | Purpose |
|--------|-----|---------|
| `__constructor(owner, owner_pk, native_sac)` | deploy-time | Atomic init — no unauthenticated `init` |
| `add_session(pk, expires_ledger, per_tx_max, session_max)` | owner `Address.require_auth` | Register AI session |
| `revoke_session(pk)` | owner | Kill session on-chain |
| `get_session(pk)` | anyone | Read policy + spent |
| `__check_auth` | host | Owner or session ed25519; **native SAC `transfer` only**; per-tx + lifetime caps |

Session signatures **cannot** authorize admin methods on the account contract.

## 4. Canary deploy (one opt-in account)

```powershell
# Fund deployer/funder on testnet first. Never commit secrets.
$env:CANARY_DEPLOYER_SECRET="S..."
$env:CANARY_OWNER_G="G..."
$env:CANARY_OWNER_SECRET="S..."   # or CANARY_OWNER_PK_HEX
$env:CANARY_FUNDER_SECRET="S..."  # optional; defaults to deployer
$env:STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
node scripts/canary-deploy.mjs
```

Then (authenticated API):

```http
POST /smart-account/enable-contract-custody
{ "confirm": "ENABLE_CONTRACT_CUSTODY", "contractRef": "C…", "wasmHash": "…", "contractVersion": "phase9c-v1", "deployTxHash": "…" }
```

Rollback (no delete / no automatic G sweep):

```http
POST /smart-account/rollback-legacy
{ "confirm": "ROLLBACK_LEGACY" }
```

Fund the C-account via **native SAC transfer** only — never Friendbot or Horizon `loadAccount(C…)`.

## 5. Runtime env

| Var | Purpose |
|-----|---------|
| `STELLAR_RPC_URL` | Soroban RPC |
| `NATIVE_SAC_CONTRACT_ID` | Optional override |
| `RELAYER_SECRET` | Backend fee-payer G secret (never to clients) |
| `STELLAR_HORIZON_URL` | Legacy G-account path |

## 6. Cutover status

- **Default for new users:** still **legacy** G-account (`custodyMode=legacy`)
- **Contract path:** opt-in canary only until security review + migration gate
- Off-chain policy, approvals, idempotency, and two-retry technical ceiling unchanged

See `docs/TECHNICAL_VALIDATION.md` and `docs/SECURITY.md`.
