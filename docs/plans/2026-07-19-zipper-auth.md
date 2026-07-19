# Zipper (Protocol 27) Smart Account Plan

**Goal:** Pay3 `__check_auth` uses CAP-71 `get_delegated_signers` + `delegate_auth` so AI sessions are Zipper-native delegates.

**Architecture:** Session registered as G-`Address`. Auth entry uses `AddressWithDelegates`; contract signature void; session G signs as delegate. Policy caps still enforced in `__check_auth` before `delegate_auth`.

**Stack:** soroban-sdk 27, existing JS `@stellar/stellar-sdk` if it exposes WithDelegates (else document client gap).

---
