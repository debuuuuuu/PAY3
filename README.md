# Pay3

**Public Stellar testnet beta** — AI-native financial infrastructure via MCP.

> Not mainnet. Not USDC yet. Custody today is an **interim encrypted G-address** allocation account. Soroban WASM is built (`contracts/smart-account/artifacts/`) but **not cut over**.

## Structure

```
apps/web/          Next.js — landing (/) + dashboard (/dashboard)
apps/api/          Express API — wallet auth, sessions, transfers
apps/mcp-server/   MCP stdio server (Cursor / Claude Desktop)
packages/database/ Prisma + Neon Postgres
packages/*         Policy, session, recipient, stellar, transaction engines
contracts/         Soroban smart-account (WASM ready; API not wired yet)
docs/              Architecture, security, MCP setup, launch notes
```

## Quick start (local)

```bash
npm install
cp .env.example apps/api/.env    # set DATABASE_URL (Neon) + SMART_ACCOUNT_ENCRYPTION_KEY
cp .env.example apps/web/.env

npm run db:generate
npm run db:push

npm run dev                       # web → http://localhost:3000
npm run dev:api                   # api → http://localhost:4000
```

## MCP (Cursor / Claude Desktop)

```bash
npm run build:mcp
copy .cursor\mcp.json.example .cursor\mcp.json   # paste pay3_… token
$env:PAY3_MCP_TOKEN="pay3_…"
npm run smoke:mcp
```

Full steps: [`docs/MCP_SETUP.md`](docs/MCP_SETUP.md).  
**claude.ai browser “custom connector” is not supported** (needs hosted HTTPS MCP).

Production MCP: set `PAY3_API_URL=https://pay3-api.vercel.app`.

## Live beta URLs

| | |
|--|--|
| Web | https://paythreewallet.vercel.app |
| API | https://pay3-api.vercel.app |
| Health | https://pay3-api.vercel.app/health |

Deploy notes: [`docs/PRODUCTION.md`](docs/PRODUCTION.md). Smoke: `node scripts/smoke-prod.mjs`

## Status

See [`docs/STATUS_REPORT.md`](docs/STATUS_REPORT.md).
