# Pay3 — Plain-English Status Report

**Date:** 10 Jul 2026  
**Audience:** You (founder / builder) — not engineers only  
**Goal of this doc:** Explain *what* we built, *why*, and *where you are* without jargon overload.

---

## 1. What is Pay3 (in one sentence)?

Pay3 lets someone say to an AI like Claude: *“Pay 5 USDC to Hurain”* — and money moves on Stellar **safely**, without giving the AI your main wallet keys.

We are **not** building “another chat wallet.”  
We are building the **security layer between AI and money**.

---

## 2. Why all this complexity?

If you give an AI your private key, it can drain everything. That’s unacceptable.

So Pay3’s design is:

```
Your main Freighter wallet  →  keeps most of your money
         ↓ (you choose to send a little)
A separate “AI money pot”   →  only this pot can be used by AI
         ↓ (later)
Rules + approvals           →  AI can only do what you allowed
         ↓ (later)
Claude / Cursor via MCP     →  AI asks Pay3; Pay3 decides & executes
```

Everything we’ve built so far is the **foundation** for that story. Claude cannot pay anyone yet — that comes later on purpose.

---

## 3. What exists on your computer right now?

Think of the repo as **three apps + a database**:

| Piece | What it is | URL / place |
|-------|------------|-------------|
| **Landing page** | Marketing site (the pretty Pay3 homepage) | http://localhost:3000 |
| **Dashboard** | Your control panel after login | http://localhost:3000/dashboard |
| **API** | Backend brain (auth, accounts, balances) | http://localhost:4000 |
| **Neon database** | Cloud Postgres — remembers users & accounts | Neon (internet) |

You run **two terminals**:

1. `npm run dev` → website  
2. `npm run dev:api` → backend  

Without the API, Connect Wallet / Link smart account will fail.

---

## 4. What you can do today (user journey so far)

### Step A — Visit the site
Open the landing page. This is marketing only.

### Step B — Connect Freighter
Go to **Dashboard** → **Connect Freighter**.

**What happens:**

1. Freighter gives Pay3 your **public** address (safe to share).  
2. Pay3 asks you to **sign a short message** (not a payment).  
3. Backend checks the signature → you’re logged in.  
4. Your user row is saved in **Neon**.

**Why:** Prove “this wallet is yours” without ever taking your private key.

### Step C — Link smart account
On Overview, click **Link smart account**.

**What happens:**

1. Pay3 creates a **new Stellar testnet address** (a separate money pot).  
2. Friendbot gives it a tiny bit of test XLM so the account exists on-chain.  
3. The **secret key** for that pot is **encrypted** and stored in Neon.  
4. The browser only ever sees the **public address** (+ QR).

**Why:** AI (later) should spend from this pot, not from your main Freighter balance.

> **Important honesty:** This is an *interim* design. The final product wants a **Soroban smart contract** account. We haven’t built that contract yet. For now we use a normal Stellar account as a stand-in so we can keep building the product.

### Step D — Fund it (optional)
Copy address or scan **QR** → send testnet XLM from Freighter → **Refresh balances**.

**Why:** Only money you put in this pot can later be used by AI.

### Step E — History
**History** tab shows on-chain payments for that pot (from Stellar’s Horizon API).

---

## 5. What is *not* working yet (and that’s OK)

| Feature | Status | Why not yet |
|---------|--------|-------------|
| Claude / Cursor paying someone | ❌ | Needs sessions + policy + MCP (later phases) |
| Contacts (“Hurain” → address) | ❌ | Next phase |
| Policy engine (auto / approve / reject) | ❌ | After sessions |
| Real Soroban smart contract | ❌ | Research + contracts later |
| Mainnet real money | ❌ | Still on **testnet** (fake/test XLM) |

If you expected “AI pays people today,” that expectation is ahead of the build. We’re still in **foundation + funding pot**.

---

## 6. Why we did things in this order

From the product spec (`maincontext.md`):

1. Landing → people understand the product  
2. Wallet login → identity without passwords  
3. Separate money pot → safety boundary  
4. Contacts → don’t guess who “Hurain” is  
5. AI sessions + permission screen → you approve what AI can do  
6. Policy + transaction engine → safe execution  
7. MCP → Claude can call Pay3  

**We skipped ahead to MCP earlier in planning, then corrected:** sessions must come **before** MCP, or AI would have nothing safe to attach to.

---

## 7. Folder map (only what matters)

```
pay3-deb/
├── apps/web/          Website + dashboard (what you see)
├── apps/api/          Backend (auth, smart account, history)
├── packages/database/ Database schema (Prisma → Neon)
├── packages/stellar/  Talks to Stellar testnet
├── packages/shared/   Shared types
├── docs/              Plans & this report
├── maincontext.md     Full product bible (long)
└── context.md         Short marketing copy
```

---

## 8. Common confusion → clear answers

**“Why Neon / database?”**  
So when you refresh or restart the API, your user + smart account still exist.

**“Why Freighter?”**  
It’s a Stellar browser wallet. Pay3 doesn’t invent a new login; you prove ownership with a signature.

**“Why QR code?”**  
So you (or a phone wallet) can fund the pot by scanning instead of only copying the address. It’s for **funding your pot**, not for “anyone pays Pay3 as a merchant” yet.

**“Why do I see errors like api/ext/404?”**  
Those are usually from the **Freighter extension**, not from Pay3. Ignore them unless `/auth` or `/smart-account` fails.

**“Why testnet?”**  
So we can break things without losing real money.

**“What does Overview ‘pending’ / ‘linked’ mean?”**  
- **pending** = user exists, pot not created yet  
- **linked** = pot address created and ready to fund  

---

## 9. Progress scorecard

| Phase | Name | Status |
|-------|------|--------|
| 0 | Foundation (monorepo, API, Neon, docs) | ✅ Done |
| 1 | Wallet auth + dashboard shell | ✅ Done |
| 2 | Smart account + fund + QR + history | ✅ Done (interim G-account) |
| 3 | Contacts (“Hurain”) | ✅ Done |
| 4 | AI sessions + permission review | ✅ Done |
| 5 | Policy engine | ✅ Done |
| 6 | Transaction engine | ✅ Done |
| 7 | MCP (Claude can call Pay3) | ✅ Done — see `docs/MCP_SETUP.md` |
| 9 | Real Soroban contracts | ⬜ Later |

**Roughly:** ~25–30% of the MVP path by *user-visible* journey steps; more of the *plumbing* is ready than the *AI payment* demo.

---

## 10. What you should do next (simple)

1. Keep both servers running (`dev` + `dev:api`).  
2. Connect Freighter → Link smart account → fund with a little test XLM → check History.  
3. When that feels clear, we build **Contacts** (save a name → address).  
4. Then **AI sessions**.  
5. Only then **Claude pays someone**.

---

## 11. Bottom line

**What’s happening:** We’re building Pay3 step by step from a landing page into a real product that can safely let AI move limited funds.

**Why it’s happening this way:** Security first — separate pot, no primary key storage, no AI access until rules exist.

**Where you are:** Logged-in dashboard + fundable testnet pot. Not yet “talk to Claude and pay.”

If one sentence for a teammate:  
> *“Wallet login and a separate encrypted testnet money pot work; AI payments are the next chapters, not this one.”*
