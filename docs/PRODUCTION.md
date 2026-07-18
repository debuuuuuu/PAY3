# Production — public testnet beta

Pay3 ships as a **Stellar testnet beta**. Do not point Freighter at mainnet or expect USDC yet.

## Architecture

```
Vercel web — https://paythreewallet.vercel.app
  NEXT_PUBLIC_API_URL=/api
  API_PROXY_ORIGIN=https://pay3-api.vercel.app
        ↓ rewrites /api/*
Vercel API (bundled Express) — https://pay3-api.vercel.app
        ↓
Neon Postgres (DATABASE_URL + DIRECT_URL)
```

Same-origin `/api` proxy keeps Freighter session cookies first-party.

Redeploy API: `node scripts/deploy-api-vercel.mjs` (set `SKIP_ENV_PUSH=1` after first env push).

## 1. Neon

1. Create or reuse a Neon project (testnet beta can share the existing DB if you accept that risk).
2. Copy **pooled** → `DATABASE_URL`, **direct** → `DIRECT_URL`.
3. Run from CI or locally: `npm run db:push` against prod URLs once.

## 2. API host

**Beta (live):** `https://pay3-api.vercel.app` — Express bundled via `scripts/bundle-api.mjs` + `scripts/deploy-api-vercel.mjs`.

For a long-running Node process later, use the root `Dockerfile` on Railway / Render / Fly.

Required env:

```env
NODE_ENV=production
PORT=4000
WEB_ORIGIN=https://paythreewallet.vercel.app
DATABASE_URL=...
DIRECT_URL=...
SMART_ACCOUNT_ENCRYPTION_KEY=<long-random-secret>
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

Health: `GET https://pay3-api.vercel.app/health` → `{"ok":true,...}`

Start command example:

```bash
npm run build:api && npm run start -w @pay3/api
```

Or from `apps/api` after workspace install: `npm run build && npm start`.

## 3. Web (Vercel)

Root directory: `apps/web` (or monorepo with filter).

Env:

```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://paythreewallet.vercel.app
NEXT_PUBLIC_STELLAR_NETWORK=Test SDF Network ; September 2015
API_PROXY_ORIGIN=https://pay3-api.vercel.app
```

Push + redeploy: `node scripts/vercel-push-web-env.mjs`

For **WalletConnect** on `/login/qr/:id`, set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` from [WalletConnect Cloud](https://cloud.walletconnect.com/) on the web project and redeploy.

[`apps/web/next.config.ts`](../apps/web/next.config.ts) rewrites `/api/{auth,smart-account,...}` to `API_PROXY_ORIGIN`.

## 4. MCP against production

```json
{
  "mcpServers": {
    "pay3": {
      "command": "node",
      "args": ["<absolute-path>/apps/mcp-server/dist/index.js"],
      "env": {
        "PAY3_API_URL": "https://pay3-api.vercel.app",
        "PAY3_MCP_TOKEN": "pay3_…"
      }
    }
  }
}
```

Build MCP once: `npm run build:mcp`. Create a **new** AI session after launch; revoke tokens that were shared in chat.

## 5. Launch smoke checklist

Automated: `node scripts/smoke-prod.mjs`

- [x] `/health` on API (`https://pay3-api.vercel.app/health`)
- [x] Landing + `/dashboard` on web
- [x] Same-origin `/api/health` proxy
- [ ] Freighter connect (testnet) — manual in browser
- [ ] Link allocation account → fund → History
- [ ] MCP `get_balance` + small `transfer` (`PAY3_API_URL=https://pay3-api.vercel.app`)
- [ ] Approvals + Settings → REVOKE ALL AI ACCESS
- [ ] Audit + monthly usage

## Security notes

- Never commit `.env` or `.cursor/mcp.json`
- Rotate `SMART_ACCOUNT_ENCRYPTION_KEY` only with a migration plan (existing ciphertext becomes unreadable)
- Interim G-account secrets stay encrypted at rest; never returned to clients
