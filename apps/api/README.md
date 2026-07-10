# Pay3 Backend Monorepo

Backend structure per `docs/PROJECT_CONTEXT.md` §43.

## Layout

```
pay3/
├── apps/
│   ├── api/              # Express.js REST API
│   └── mcp-server/       # MCP server (get_balance, transfer, get_transaction_history)
├── packages/
│   ├── database/         # Prisma schema + PostgreSQL access
│   ├── stellar/          # Stellar JS SDK integration
│   ├── policy-engine/    # Off-chain policy evaluation
│   ├── transaction-engine/
│   ├── recipient-resolver/
│   ├── auth/             # Wallet-signature authentication
│   ├── session-manager/  # AI session keys
│   └── shared/           # Shared types and utilities
├── contracts/
│   └── smart-account/    # Soroban Rust smart account
├── src/                  # Next.js landing (existing frontend)
└── docs/
```

## Workspaces

| Package | Purpose |
|---------|---------|
| `@pay3/api` | Express backend — routes, controllers, middleware, workers |
| `@pay3/mcp-server` | MCP bridge for external AI assistants |
| `@pay3/database` | Prisma ORM + Neon PostgreSQL |
| `@pay3/auth` | Stellar wallet challenge/signature auth |
| `@pay3/stellar` | Transaction construction and submission |
| `@pay3/session-manager` | Encrypted AI session key lifecycle |
| `@pay3/policy-engine` | AUTO / APPROVAL / REJECT decisions |
| `@pay3/transaction-engine` | Idempotency, retries, lifecycle |
| `@pay3/recipient-resolver` | Contact and address resolution |
| `@pay3/shared` | Cross-package types and constants |

## Environment

Copy `.env.example` to `.env` at the repository root and set required values before starting the API or MCP server.

```bash
cp .env.example .env
npm run config:check   # validate config parsing logic
```

Required variables: `DATABASE_URL`, `AUTH_SESSION_SECRET`, `SESSION_KEY_ENCRYPTION_KEY`.

Apply the schema to Neon PostgreSQL:

```bash
npm run db:push      # prototype / dev sync
npm run db:migrate   # versioned migrations (production)
npm run db:validate  # validate Prisma schema
npm run db:check     # schema + enum self-check
```

MVP constants from `PROJECT_CONTEXT.md` are fixed in code (not overridable via env):

- Manual approval expiry: **2 minutes**
- Transaction auto-retries: **2** additional attempts

## Scripts

```bash
npm install          # install all workspaces
npm run dev          # Next.js landing + dashboard (port 3000)
npm run dev:api      # Express API (port 3001)
npm run dev:mcp      # MCP server (needs PAY3_MCP_AUTH_TOKEN)
npm run build:backend
npm run test:backend
```

## Dashboard smoke path

1. `npm run db:push` then `npm run dev:api` and `npm run dev`.
2. Open http://localhost:3000/login — connect Freighter (testnet), sign challenge.
3. Deploy vault per [contracts/smart-account/README.md](../../contracts/smart-account/README.md); set `SOROBAN_SMART_ACCOUNT_CONTRACT_ID` and `STELLAR_USDC_SAC_CONTRACT_ID`.
4. Dashboard → Sessions → link contract ID → create policy → create AI session.
5. Owner runs on-chain `add_session` (CLI) using `onChainRegistration` from the create response.
6. Deposit USDC into the vault; paste `mcpAuthToken` into MCP client / `.env`.
7. MCP `get_balance` / `transfer` → vault transfer when contract is linked; Approvals / Transactions update in the dashboard.

Without a linked contract, transfers fall back to classic Horizon payments from the session G-account (dev bootstrap only).
