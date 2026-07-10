# Pay3

AI-native financial infrastructure on Stellar — landing site + MVP monorepo.

## Structure

```
apps/web/          Next.js — landing (/) + dashboard (/dashboard)
apps/api/          Express API — wallet auth, sessions, transfers
apps/mcp-server/   MCP stdio server (Claude / Cursor)
packages/database/ Prisma schema + client (Neon Postgres)
packages/shared/   Shared types
packages/*         Policy, session, recipient, stellar, transaction engines
contracts/         Soroban smart account (later)
docs/              Architecture, security, implementation plan
```

## Quick start

```bash
npm install
cp .env.example apps/api/.env    # set DATABASE_URL (Neon)
cp .env.example apps/web/.env

npm run db:generate
npm run db:push                   # requires DATABASE_URL

npm run dev                       # web → http://localhost:3000
npm run dev:api                   # api → http://localhost:4000
```

See `docs/DATABASE.md`, `docs/MCP_SETUP.md`, and `docs/STATUS_REPORT.md`.
