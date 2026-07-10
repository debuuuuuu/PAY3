export interface WalletChallengeResponse {
  challengeId: string;
  nonce: string;
  message: string;
  walletAddress: string;
  network: string;
  expiresAt: string;
}

export interface WalletAuthSession {
  sessionToken: string;
  expiresAt: string;
  userId: string;
  walletId: string;
  walletAddress: string;
  network: string;
}

export interface AuthenticatedWalletContext {
  sessionId: string;
  userId: string;
  walletId: string;
  walletAddress: string;
  network: string;
  expiresAt: Date;
}
