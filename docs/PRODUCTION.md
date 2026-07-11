# Production — public testnet beta

Pay3 ships as a **Stellar testnet beta**. Do not point Freighter at mainnet or expect USDC yet.

## Architecture

```
Vercel (apps/web)
  NEXT_PUBLIC_API_URL=/api
  API_PROXY_ORIGIN=https://<your-api-host>
        ↓ rewrites /api/*
Railway / Render / Fly (apps/api)
        ↓
Neon Postgres (DATABASE_URL + DIRECT_URL)
```

Same-origin `/api` proxy keeps Freighter session cookies first-party.

## 1. Neon

1. Create or reuse a Neon project (testnet beta can share the existing DB if you accept that risk).
2. Copy **pooled** → `DATABASE_URL`, **direct** → `DIRECT_URL`.
3. Run from CI or locally: `npm run db:push` against prod URLs once.

## 2. API host (Node, always-on)

Deploy `apps/api` (or monorepo root with start script for the API workspace).

Required env:

```env
NODE_ENV=production
PORT=4000
WEB_ORIGIN=https://<your-vercel-domain>
DATABASE_URL=...
DIRECT_URL=...
SMART_ACCOUNT_ENCRYPTION_KEY=<long-random-secret>
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

Health: `GET https://<api>/health` → `{"ok":true,...}`

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
NEXT_PUBLIC_SITE_URL=https://<your-vercel-domain>
NEXT_PUBLIC_STELLAR_NETWORK=Test SDF Network ; September 2015
API_PROXY_ORIGIN=https://<your-api-host>
```

[`apps/web/next.config.ts`](../apps/web/next.config.ts) rewrites `/api/{auth,smart-account,...}` to `API_PROXY_ORIGIN`.

## 4. MCP against production

```json
{
  "mcpServers": {
    "pay3": {
      "command": "node",
      "args": ["<absolute-path>/apps/mcp-server/dist/index.js"],
      "env": {
        "PAY3_API_URL": "https://<your-api-host>",
        "PAY3_MCP_TOKEN": "pay3_…"
      }
    }
  }
}
```

Build MCP once: `npm run build:mcp`. Create a **new** AI session after launch; revoke tokens that were shared in chat.

## 5. Launch smoke checklist

- [ ] `/health` on API
- [ ] Landing + `/dashboard` on web
- [ ] Freighter connect (testnet)
- [ ] Link allocation account → fund → History
- [ ] MCP `get_balance` + small `transfer`
- [ ] Approvals + Settings → REVOKE ALL AI ACCESS
- [ ] Audit + monthly usage

## Security notes

- Never commit `.env` or `.cursor/mcp.json`
- Rotate `SMART_ACCOUNT_ENCRYPTION_KEY` only with a migration plan (existing ciphertext becomes unreadable)
- Interim G-account secrets stay encrypted at rest; never returned to clients
