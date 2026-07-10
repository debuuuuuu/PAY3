export { AuthError, type AuthErrorCode } from "./errors.js";
export { buildAuthChallengeMessage } from "./challenge-message.js";
export { normalizeWalletAddress, toPrismaNetwork } from "./network.js";
export {
  assertValidWalletAddress,
  parseSignature,
  verifyWalletSignature,
} from "./signature.js";
export {
  generateChallengeNonce,
  generateSessionToken,
  hashSessionToken,
} from "./tokens.js";
export {
  createWalletAuthService,
  WalletAuthService,
  type WalletAuthConfig,
} from "./wallet-auth-service.js";
export { findOrCreateUserWallet } from "./wallet-account.js";
export type {
  AuthenticatedWalletContext,
  WalletAuthSession,
  WalletChallengeResponse,
} from "./types.js";
