# Production — Stellar testnet

Pay3 ships on **Stellar testnet**. Freighter must be set to **testnet**. Fund pots with Friendbot / play XLM.

## Architecture

```
Vercel web — https://paythreewallet.vercel.app
  NEXT_PUBLIC_API_URL=/api
  NEXT_PUBLIC_STELLAR_NETWORK=Test SDF Network ; September 2015
  API_PROXY_ORIGIN=https://pay3-api.vercel.app
        ↓ rewrites /api/*
Vercel API (bundled Express) — https://pay3-api.vercel.app
        ↓
Neon Postgres (DATABASE_URL + DIRECT_URL)
Horizon testnet + Soroban RPC testnet
```

Same-origin `/api` proxy keeps Freighter session cookies first-party.

Redeploy API: `node scripts/deploy-api-vercel.mjs` (set `SKIP_ENV_PUSH=1` after first env push).  
Push web env: `node scripts/vercel-push-web-env.mjs`

## Required env (API)

```env
NODE_ENV=production
PORT=4000
WEB_ORIGIN=https://paythreewallet.vercel.app
DATABASE_URL=...
DIRECT_URL=...
SMART_ACCOUNT_ENCRYPTION_KEY=<long-random-secret>
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
SOROSWAP_NETWORK=testnet
# SOROSWAP_API_KEY=...
# RELAYER_SECRET=S...
```

## Required env (Web)

```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://paythreewallet.vercel.app
NEXT_PUBLIC_STELLAR_NETWORK=Test SDF Network ; September 2015
API_PROXY_ORIGIN=https://pay3-api.vercel.app
```

## Linking a jar on testnet

1. Connect Freighter (**testnet**).
2. Link smart account → Pay3 creates a G-address.
3. Friendbot funds new allocation accounts when no relayer is set.
4. Old **mainnet** allocation accounts will not work on testnet Horizon — re-link / fund a new jar.

WalletConnect uses CAIP chain `stellar:testnet`.  
Explorer links use `stellar.expert/explorer/testnet/...`.

Health: `GET https://pay3-api.vercel.app/health` → `{"ok":true,...}`
