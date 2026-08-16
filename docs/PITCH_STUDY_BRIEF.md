# Pay3 — Pitch Study Brief (full system)

> **How to use this file with an LLM**  
> Paste this entire document into ChatGPT / Claude / Cursor, then say:
>
> ```
> You are my pitch coach for Pay3. This document is the ONLY source of truth.
> Quiz me like a tough judge. Ask one question at a time. After I answer, grade me
> (correct / incomplete / wrong), then give the ideal 20–40 second answer.
> Start with the hardest system-design questions. Never invent features that are
> marked "not live yet" in this doc.
> ```
>
> Extra commands you can use:
> - `Explain the payment flow end to end like I'm pitching to a non-technical judge`
> - `Give me a 60-second elevator pitch`
> - `Give me a 3-minute demo script`
> - `Ask me security house rules until I recite them perfectly`
> - `What will judges attack? Prep my rebuttals`
> - `Draw the architecture in ASCII`

**Last updated:** July 2026  
**Product status:** Stellar **mainnet** (real XLM — fund pots carefully)  
**Tagline:** Delegate. Validate. Execute.  
**One-liner:** Pay3 is the security layer between AI and money on Stellar.

---

## 0. Elevator pitches (memorize)

### 15 seconds
Pay3 lets an AI like Cursor or Claude send Stellar payments from a small allowance pot you fund — under rules you set — without ever touching your Freighter private key.

### 30 seconds
AI agents can chat, but they can’t safely pay. If you give a model your wallet key, one mistake drains everything. Pay3 isolates AI spend into a separate funded pot, wraps it in session limits and a policy engine (AUTO / APPROVAL / REJECT), and exposes tools through MCP. Your main wallet stays in Freighter. When unsure, Pay3 says no.

### 60 seconds
Pay3 is MCP-powered financial infrastructure on Stellar. You connect Freighter, fund an allocation account, save contacts, create an AI session with budgets and permissions, then paste a one-time token into Cursor. When you say “Pay Hurain 0.5 XLM,” the AI calls Pay3 → recipient resolver (never guesses) → policy engine → transaction engine → Stellar settlement. Secrets are encrypted at rest. Sessions expire and revoke. We’re live as a testnet beta with end-to-end MCP transfers; Soroban Zipper smart-account custody is built as an opt-in canary. Roadmap: mainnet, USDC, x402 micropayments, DeFi.

---

## 1. What problem we solve

| Old world | Pay3 world |
|-----------|------------|
| Give the bot your whole wallet | Give the bot a **limited jar** |
| Guess who “Alex” is | **Reject** ambiguous names |
| Hope the model behaves | **Policy** + expiry + revoke |
| Keys in prompts / frontends | Keys **encrypted at rest**, used only in API memory |
| Human credit cards / subscriptions | Machine-native tool calls via **MCP** |

**Why now:** MCP standardizes how AI apps call tools. Agents are moving from chat to action. The missing layer is **trusted money with hard limits**.

**What we are NOT:** Another chat wallet. Not “AI that holds your Freighter key.”

---

## 2. Core metaphor (use in every pitch)

1. **Big piggy bank** = Freighter (your real wallet). Pay3 never stores its private key.  
2. **Small jar** = Allocation account (AI money pot). You fund only what you’re OK testing.  
3. **Note on the jar** = Session policy (limits, allowed actions, approval threshold).  
4. **Robot helper** = Cursor / Claude calling Pay3 MCP tools.  
5. **School teacher** = Policy engine — AUTO, APPROVAL, or REJECT.

---

## 3. Who it’s for

| Actor | What they want |
|-------|----------------|
| End user | Connect wallet, set rules, sleep easier |
| AI agent | Call tools: balance, pay, history, swap |
| Builders | Plug agents into payments without reinventing security |
| (Vision) API/MCP providers | Monetize endpoints via x402 |
| (Vision) Enterprises | Org wallets, compliance, audit |

---

## 4. Live product vs vision (CRITICAL — don’t overclaim)

### Live today (Stellar mainnet)

- Website + dashboard: https://paythreewallet.vercel.app  
- API: https://pay3-api.vercel.app  
- Docs: https://pay3.mintlify.site  
- Freighter login (+ QR / WalletConnect login path) on **mainnet**  
- Allocation pot (legacy G-account) + fund + QR + balances + history  
- Contacts (name → address)  
- AI sessions + one-time MCP token + revoke  
- Off-chain policy engine (3 levels)  
- Transaction engine (idempotency + capped technical retry)  
- MCP tools: `get_balance`, `transfer`, `get_transaction_history`, `get_swap_quote`, `execute_swap` (opt-in)  
- Approvals UX + emergency revoke patterns + audit log  
- Soroswap quote/execute on mainnet (pools dependent; legacy G custody)  
- Zipper / Soroban smart-account **code + WASM + opt-in canary** (NOT default)

### Not default / not everyday yet

- USDC as the default everyday asset (native XLM is the primary path)  
- Full x402 marketplace / pay-per-request economy  
- Contract custody for **every** new user (still opt-in canary)  
- DeFi (Blend/Phoenix/Aquarius) as everyday product surface — marketing vision expanding  
- Browser claude.ai custom connectors without hosted HTTPS MCP quirks

**Honest pitch line:**  
> “Mainnet: MCP payments on legacy G-accounts; Soroban Zipper canary ready opt-in. Only fund the jar with what you’re willing to spend. If unsure, Pay3 says no — that is a feature.”

---

## 5. System design (memorize this diagram)

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENTS                                                     │
│  Next.js Web + Dashboard  |  AI (Cursor/Claude via MCP)     │
│  Freighter wallet         |  Phone QR login                 │
└────────────┬───────────────────────────┬────────────────────┘
             │                           │
             ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│ API EDGE (Express on Vercel) — https://pay3-api.vercel.app  │
│  Wallet auth (challenge/verify) · AI sessions · Hosted MCP  │
│  REST: contacts, history, approvals, smart-account          │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ OFF-CHAIN CONTROL PLANE                                     │
│  Recipient Resolver (never guess)                           │
│  Policy Engine → AUTO_EXECUTE | PENDING_APPROVAL | REJECTED │
│  Transaction Engine → lifecycle, idempotency, smart retry   │
│  Soroswap quote / execute                                   │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ DATA                                                        │
│  Neon Postgres + Prisma                                     │
│  AES-GCM encrypted vault (allocation / session secrets)     │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ STELLAR                                                     │
│  Default: Allocation G-account (interim)                    │
│  Opt-in: Zipper Soroban C-account (canary)                  │
│  Horizon / Soroban RPC                                      │
└─────────────────────────────────────────────────────────────┘
```

### Deployment topology

```
Browser → Vercel Web (paythreewallet.vercel.app)
            └─ /api/* rewrite proxy → Vercel API (pay3-api.vercel.app)
                                         ├─ Neon Postgres
                                         ├─ Stellar testnet
                                         └─ Soroswap API
AI host → Bearer session token → API /mcp
```

**Why same-origin `/api` proxy?** Keeps Freighter session cookies first-party (no cross-site cookie pain).

---

## 6. Monorepo map (what lives where)

```
pay3/
├── apps/web/              Next.js — landing (GSAP), dashboard, guide
├── apps/api/              Express — auth, sessions, MCP HTTP, swaps
├── apps/mcp-server/       stdio MCP for local Cursor / Claude Desktop
├── packages/
│   ├── database/          Prisma schema → Neon
│   ├── policy-engine/     3-level AUTO / APPROVAL / REJECT
│   ├── session-manager/   AI session lifecycle + default rules
│   ├── transaction-engine/ status + technical retry ceiling
│   ├── recipient-resolver/ never guess contacts
│   ├── stellar/           Horizon, Friendbot, Soroban helpers
│   └── shared/            types & constants
├── contracts/smart-account/  Soroban Zipper (Protocol 27 / CAP-71)
└── docs/                  architecture, security, MCP setup, this brief
```

**Engineering law:** UI stays in `apps/web`. Business logic and secrets stay in API + packages. Never put signing secrets in the frontend.

---

## 7. Custody model (judges love this)

| Layer | What | Default today |
|-------|------|---------------|
| **Primary** | Freighter G-address | Never stored by Pay3 |
| **AI jar (legacy)** | Separate G-account; secret AES-GCM in Neon | ✅ Default |
| **AI jar (Zipper)** | Soroban C-account; CAP-71 delegates | 🟡 Opt-in canary |

```
Freighter (you)  ──manual fund──►  Allocation G… or Contract C…
                                         │
                                         ▼
                              AI session (encrypted material + policy + expiry)
                                         │
                                         ▼
                              MCP tools (balance / transfer / swap / history)
```

**Why interim G-account?** So the product (auth → sessions → policy → MCP) could ship before full on-chain smart-account UX was production-default. Soroban path exists; default stays legacy until security soak.

---

## 8. End-to-end user journey

### A. Human login (Freighter)

1. User opens dashboard → Connect Freighter.  
2. API `POST /auth/challenge` with public key → stores one-time nonce.  
3. Freighter **signs a message** (not a payment).  
4. API `POST /auth/verify` → checks signature → httpOnly session cookies.  
5. User row upserted in Neon.

**Pitch line:** “We prove wallet ownership without ever taking the private key.”

### B. Link allocation pot

1. Dashboard → Link smart account.  
2. Pay3 creates a new Stellar testnet G-address.  
3. Friendbot seeds it so it exists on-chain.  
4. Secret encrypted (AES-GCM) in Neon; browser only sees public address + QR.  
5. User funds pot from Freighter (manual).  

**Overview states:** `pending` = no pot yet · `linked` = pot ready to fund.

### C. Contacts

- Save `Hurain → G…`  
- AI can say “pay Hurain”  
- If 0 matches → fail  
- If 2+ matches → **ambiguous → reject, ask human**  
- Never guess

### D. Create AI session

1. User sets duration, daily budget, per-tx max, approval threshold, allowed actions.  
2. Reviews permissions, signs with Freighter.  
3. Gets **one-time** MCP token (`pay3_…`) — shown once; only hash stored.  
4. Pastes into Cursor MCP config.  
5. Can revoke anytime from dashboard.

### E. AI payment (MCP)

```
AI → transfer(recipient, amount)
  → Recipient resolver
  → Policy evaluate
       REJECTED  → error (no spend, no money-retry)
       PENDING_APPROVAL → wait for human tap (~2 min expiry)
       AUTO_EXECUTE → Transaction engine
            → decrypt secret in memory only
            → sign + submit on Stellar
            → idempotency key
            → return tx hash / receipt
            → audit log
```

---

## 9. Policy engine (know cold)

**Location:** `packages/policy-engine`  
**Decisions:**

| Decision | Meaning |
|----------|---------|
| `AUTO_EXECUTE` | Within rules → run |
| `PENDING_APPROVAL` | Above approval threshold → human must approve |
| `REJECTED` | Hard no |

**Checks (in order of thinking):**

1. Session active? (not expired/revoked)  
2. Action in `allowedActions`?  
3. Read-only (`get_balance`, `get_transaction_history`, `get_swap_quote`) → AUTO  
4. For spend actions (`transfer`, `execute_swap`, `x402_fetch`):  
   - Asset matches session asset  
   - Recipient / asset_out present  
   - Amount > 0  
   - Amount ≤ `perTxMax`  
   - `spentToday + amount` ≤ `dailyBudget`  
   - If amount > `approvalAbove` → PENDING_APPROVAL  
   - Else AUTO_EXECUTE  

**Presets:** conservative / balanced / custom.

---

## 10. Recipient resolver (security talking point)

**Location:** `packages/recipient-resolver`

- If input looks like `G…` → validate Stellar public key  
- Else match contact name (case-insensitive)  
- 0 matches → `not_found`  
- 2+ matches → `ambiguous` (return matches, do not pick)  
- Exactly 1 → resolve  

**Pitch line:** “Guessing wrong with money is unacceptable. Ambiguity is a hard stop.”

---

## 11. Transaction engine

**Location:** `packages/transaction-engine`

**Statuses include:** CREATED, VALIDATING, AUTO_APPROVED, PENDING_APPROVAL, SIGNING, SUBMITTING, SUCCESS, FAILED, REJECTED, EXPIRED, CANCELLED.

**Retry rules (non-negotiable):**

- Technical / RPC blips may retry — **max 2 additional retries**  
- **Never** auto-retry: insufficient funds, policy reject, expired session, auth failure  
- Transfers are **idempotent** (IdempotencyRecord) so double-submit doesn’t double-pay  

---

## 12. MCP tools

**Hosted:** `POST https://pay3-api.vercel.app/mcp` with `Authorization: Bearer pay3_…`

| Tool | Kind | Notes |
|------|------|-------|
| `get_balance` | Read | Jar balance |
| `get_transaction_history` | Read | Recent txs |
| `transfer` | Spend | Contacts or G-address; policy gated |
| `get_swap_quote` | Read | Soroswap aggregator (Soroswap/Phoenix/Aqua) |
| `execute_swap` | Spend | Opt-in permission; network must align; legacy G for now |

**Clients:**

- Cursor hosted URL or local stdio → prod API  
- Claude Desktop local stdio  
- Browser claude.ai: hosted HTTPS MCP possible but cold-start quirks on Vercel  

---

## 13. Security house rules (recite these)

1. **Never** store the user's primary Freighter private key.  
2. **Never** expose AI session secrets to frontend, AI models, or API responses.  
3. **Never** guess ambiguous recipients — reject and ask.  
4. **Never** auto-retry financial failures (funds / policy / expired session).  
5. Every session **expires** and is **individually revocable**.  
6. Every spend passes **policy**; transfers are **idempotent**.  
7. Main wallet funds stay **isolated** from the AI jar.  
8. Manual approvals **expire** (~2 minutes).  
9. Secrets encrypted at rest (AES-GCM); decrypted only in backend memory for signing.  
10. Relayer secret (fee payer, if used) is backend-only — never returned to clients.

**Closing line:** If unsure, Pay3 says no — that is a feature.

---

## 14. Database (what we remember)

**Neon Postgres + Prisma.** Tables conceptually:

- `User`, `Wallet` — identity linked to Freighter public key  
- `SmartAccount` — allocation pot (public address + encrypted secret; custody mode)  
- `Contact` — name tags  
- `AiSession` — hall pass + policy rules + token hash + expiry  
- `Policy` — policy records  
- `Transaction` — lifecycle of spends  
- `ApprovalRequest` — pending human approvals  
- `IdempotencyRecord` — prevent double execution  
- `UsageRecord`, `AuditLog` — observability  
- `AuthChallenge` — one-time login nonces  
- `QrLoginSession` — phone QR login  

**Why a DB?** Restarts must not erase users, pots, sessions, or audit trail.

---

## 15. Tech stack

| Layer | Tech |
|-------|------|
| Web | Next.js App Router, GSAP landing, Freighter |
| API | Express on Vercel |
| DB | Prisma + Neon Postgres |
| Chain | Stellar testnet, Horizon, Soroban RPC |
| Swaps | Soroswap aggregator API |
| AI | MCP (stdio + hosted HTTP) |
| Contracts | Rust Soroban smart-account (Zipper / CAP-71) |
| Auth | Wallet signature challenge (no passwords) |

**Fonts/theme (if asked about brand):** Black `#000000`, Space Grotesk headlines, DM Sans body, JetBrains Mono labels, glass cards, accents emerald / violet / cyan.

---

## 16. Why Stellar

- 3–5 second finality  
- Fractions of a penny fees (micropayments friendly)  
- Native multi-asset (XLM now; USDC path later)  
- Soroban smart contracts for programmable auth  
- Zipper / Protocol 27 / CAP-71 → delegated signing model fits “AI hall pass”  
- Strong builder + AI docs ecosystem  

**Positioning:** Stellar-native agent finance infrastructure — not a generic EVM wallet wrapper.

---

## 17. Request lifecycles (sequence form)

### Login
User → Web → API challenge → Freighter sign message → API verify → httpOnly cookies → Neon upsert

### Payment
AI → MCP transfer → Policy → (approve if needed) → Tx engine → Sign from jar → Stellar → Receipt + audit

### Policy results to AI
- REJECT → error string, no spend  
- APPROVAL → waiting state until human approves or timeout  
- AUTO → execute and return hash  

---

## 18. Roadmap talking points

**Near-term**

- Mainnet readiness  
- USDC  
- Stronger Soroban / Zipper custody as default (after security soak)  
- More reliable hosted MCP for browser AIs  

**Mid-term**

- x402 pay-per-request APIs  
- MCP marketplace monetization  

**Long-term**

- Multi-agent workflows  
- DeFi integrations (Blend, Phoenix, Aquarius)  
- Enterprise policy / compliance / org wallets  

**Always label vision as vision.** Marketing site describes the dream; beta is XLM + policy + MCP.

---

## 19. Links & contacts

| What | URL |
|------|-----|
| Website | https://paythreewallet.vercel.app |
| API health | https://pay3-api.vercel.app/health |
| Docs | https://pay3.mintlify.site |
| GitHub | https://github.com/debuuuuuu/PAY3 |
| X | https://x.com/PAYThreeWallet |
| Email | pay3wallet@gmail.com |

---

## 20. Demo script (3–5 minutes)

1. Open landing → say tagline: Delegate. Validate. Execute.  
2. Dashboard → Connect Freighter (testnet).  
3. Show linked allocation pot + balance (funded).  
4. Show Contacts (e.g. Hurain).  
5. Create / show AI session limits.  
6. In Cursor: “What’s my Pay3 balance?” → `get_balance`.  
7. “Pay Hurain 0.5 XLM.” → policy ✓ → tx confirmed.  
8. Show History / Audit.  
9. Optional: revoke session → prove AI access dies.  
10. Close: “Main wallet never left Freighter. AI only touched the jar.”

---

## 21. Hard judge questions + ideal answers

**Q: Why not just give the AI a Stellar secret?**  
A: Blast radius. One prompt injection or hallucination empties the wallet. Pay3 separates pots, encrypts secrets, scopes sessions, and enforces policy before every spend.

**Q: Is policy on-chain?**  
A: Default path is **off-chain policy** for speed/flexibility + encrypted G-account signing. Soroban `__check_auth` Zipper path exists as **opt-in canary**; not yet default for every user.

**Q: What if there are two contacts named Alex?**  
A: We reject. Ambiguous names never auto-resolve. Human clarifies.

**Q: What happens on insufficient funds?**  
A: Fail. No automatic financial retry. Only temporary technical/RPC failures retry (capped).

**Q: Where do private keys live?**  
A: Freighter primary key never leaves the wallet. Allocation secret is AES-GCM encrypted in Neon, decrypted only in API memory for signing, never sent to frontend or models. Session token shown once; only hash stored.

**Q: Is this mainnet?**  
A: No — public Stellar testnet beta. Mainnet is roadmap after soak.

**Q: What’s your moat?**  
A: Security architecture as product: isolated jar + session hall passes + never-guess resolver + three-level policy + MCP distribution into the tools agents already use.

**Q: Who pays gas/fees?**  
A: Stellar fees are negligible on testnet; product doesn’t charge a Pay3 fee in beta. Relayer may exist for contract path fee-paying — backend-only.

**Q: How is this different from account abstraction wallets?**  
A: We’re specifically the **AI↔money control plane** with MCP-native tools and human policy UX, not just another smart wallet UI.

**Q: What’s live vs vapor?**  
A: Live: Freighter auth, jar, contacts, sessions, policy, MCP transfer E2E, approvals/audit, swap quote/execute (conditional), Zipper WASM canary. Not default: mainnet, USDC everyday, x402 marketplace, DeFi for all users.

---

## 22. Glossary

| Term | Meaning |
|------|---------|
| Freighter | Browser Stellar wallet; holds primary key |
| G-address | Classic Stellar account public key |
| C-account | Contract account (Soroban) |
| Allocation / jar | Separate pot AI can spend from |
| Session | Temporary hall pass + policy + token |
| MCP | Model Context Protocol — tool plug-in for AI apps |
| Policy engine | Off-chain AUTO / APPROVAL / REJECT |
| Zipper / CAP-71 | Stellar delegated signing for helpers |
| Soroban | Stellar smart contracts |
| x402 | HTTP 402 pay-per-request micropayment vision |
| Idempotency | Same request can’t double-spend |
| Horizon | Stellar REST API for accounts/txs |
| Neon | Serverless Postgres host |

---

## 23. Phase scorecard (build history)

| Phase | Name | Status |
|-------|------|--------|
| 0 | Foundation (monorepo, API, Neon) | ✅ |
| 1 | Wallet auth + dashboard | ✅ |
| 2 | Smart account + fund + QR + history (interim G) | ✅ |
| 3 | Contacts | ✅ |
| 4 | AI sessions + permission review | ✅ |
| 5 | Policy engine | ✅ |
| 6 | Transaction engine | ✅ |
| 7 | MCP | ✅ |
| 8 | Approvals + emergency revoke | ✅ |
| 10 | Dashboard audit + usage | ✅ |
| 9 / 9b / 9c | Soroban validation, WASM, canary wiring | ✅ code; opt-in |

---

## 24. Cheat sheet — say these exact sentences

1. “Pay3 is the security layer between AI and money.”  
2. “You keep Freighter; the AI only touches a funded jar.”  
3. “Every spend hits policy: auto, ask you, or reject.”  
4. “We never guess recipients and never auto-retry money failures.”  
5. “MCP is how Cursor/Claude call Pay3 tools.”  
6. “We’re live on Stellar testnet; mainnet and full contract custody are next.”  
7. “If unsure, Pay3 says no — that is a feature.”

---

## 25. Suggested LLM practice plan (tonight)

1. Paste this whole file.  
2. Run: *“Quiz me for 20 minutes on system design.”*  
3. Run: *“Quiz me on security house rules until perfect.”*  
4. Run: *“Interrupt me with hostile investor questions.”*  
5. Run: *“Write my 3-minute spoken pitch; then make me recite it.”*  
6. Run: *“Simulate a live demo narration while I click the product.”*  
7. Sleep. Tomorrow morning: *“Give me a 10-question warm-up quiz.”*

---

*End of brief. If something isn’t in this document, treat it as unknown — do not invent it for the pitch.*
