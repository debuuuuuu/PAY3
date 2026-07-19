# Pay3

<p align="center">
  <img src="docs/assets/pay3-banner.svg" alt="Pay3 — Safe allowance for AI money on Stellar" width="100%" />
</p>

<p align="center">
  <strong>Safe allowance for AI money on Stellar.</strong><br/>
  You keep your main wallet. The AI only spends from a small pot with rules you set.
</p>

<p align="center">
  <a href="https://paythreewallet.vercel.app">Website</a> ·
  <a href="https://pay3-api.vercel.app/health">API health</a> ·
  <a href="docs/WHAT_IS_PAY3.md">Simple guide</a> ·
  <a href="docs/MCP_SETUP.md">MCP setup</a>
</p>

---

<p align="center">
  <img src="docs/assets/pay3-flow.svg" alt="You → Pay3 checks rules → AI jar → Stellar" width="100%" />
</p>

> **New here?** Read **[`docs/WHAT_IS_PAY3.md`](docs/WHAT_IS_PAY3.md)** — the whole project in plain language (kid-friendly).

**Public Stellar testnet beta** — not mainnet as the everyday default. Custody today defaults to an **encrypted G-address** jar. Soroban / Zipper WASM is built; contract custody is **opt-in canary**.

> **Note:** GitHub READMEs can’t run JavaScript. The motion above is **animated SVG**. The live site uses full GSAP motion: https://paythreewallet.vercel.app

## Live beta

| | |
|--|--|
| Web | https://paythreewallet.vercel.app |
| API | https://pay3-api.vercel.app |
| Health | https://pay3-api.vercel.app/health |

## Structure

```
apps/web/          Next.js — landing + dashboard (GSAP motion)
apps/api/          Express — auth, sessions, transfers, hosted MCP
apps/mcp-server/   MCP stdio (Cursor / Claude Desktop)
packages/*         Policy, session, stellar, database, …
contracts/         Soroban Zipper smart-account
docs/              Start with WHAT_IS_PAY3.md
docs/assets/       Animated SVG banners for docs / README
```

## Quick start (local)

```bash
npm install
cp .env.example apps/api/.env    # DATABASE_URL (Neon) + SMART_ACCOUNT_ENCRYPTION_KEY
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
Production MCP: `https://pay3-api.vercel.app` with Bearer session token.

## Docs map

| Doc | What it is |
|-----|------------|
| [`docs/WHAT_IS_PAY3.md`](docs/WHAT_IS_PAY3.md) | **Start here** — whole project in plain language |
| [`docs/STATUS_REPORT.md`](docs/STATUS_REPORT.md) | What’s built vs not |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System flow |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Non-negotiable safety rules |
| [`docs/MCP_SETUP.md`](docs/MCP_SETUP.md) | Connect an AI |
| [`docs/PRODUCTION.md`](docs/PRODUCTION.md) | Deploy / env |
| [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) | Long-term vision |

Smoke prod: `node scripts/smoke-prod.mjs`
