/** Manual approval expires after exactly 2 minutes — PROJECT_CONTEXT.md §26 */
export const APPROVAL_EXPIRY_MS = 2 * 60 * 1000;

/** Maximum additional automatic retry attempts — PROJECT_CONTEXT.md §27 */
export const TRANSACTION_MAX_RETRIES = 2;

/** Wallet auth challenge default TTL — short-lived per PROJECT_CONTEXT.md §10 */
export const DEFAULT_AUTH_CHALLENGE_TTL_MS = 5 * 60 * 1000;

/** Authenticated web session default max age */
export const DEFAULT_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const STELLAR_NETWORK_PASSPHRASES = {
  testnet: "Test SDF Network ; September 2015",
  public: "Public Global Stellar Network ; September 2015",
} as const;

export const STELLAR_DEFAULT_ENDPOINTS = {
  testnet: {
    horizonUrl: "https://horizon-testnet.stellar.org",
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
  },
  public: {
    horizonUrl: "https://horizon.stellar.org",
    sorobanRpcUrl: "https://soroban.stellar.org",
  },
} as const;
