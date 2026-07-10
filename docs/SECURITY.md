# Pay3 Security Checklist

From `maincontext.md` §36. Gate MCP transfers on these.

- [ ] Never store user's primary private key
- [ ] Never expose session private keys to AI models
- [ ] Never expose session private keys to frontend
- [ ] Never log private signing material
- [ ] Every AI assistant gets an independent session
- [ ] Every session must expire
- [ ] Every session individually revocable
- [ ] Users can revoke all AI access
- [ ] Critical limits enforced on-chain (Phase 9)
- [ ] Every financial request passes policy validation
- [ ] Ambiguous recipients never guessed
- [ ] Idempotency on every transfer
- [ ] Technical failures may retry (max 2); policy/auth failures do not
- [ ] Manual approvals expire after 2 minutes
- [ ] Main wallet funds isolated from allocated AI funds
- [ ] AI permissions explicitly reviewed before authorization
- [ ] Backend cannot bypass user asset boundaries

## Current implementation notes

- Auth uses one-time nonce challenges; primary key stays in Freighter
- Session cookies are httpOnly; no wallet secrets in localStorage
- Encrypted session keys: not implemented yet (Phase 4)
