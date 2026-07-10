import { normalizeWalletAddress } from "./network.js";

export function buildAuthChallengeMessage(input: {
  walletAddress: string;
  network: string;
  nonce: string;
  issuedAt: Date;
  expiresAt: Date;
}): string {
  const walletAddress = normalizeWalletAddress(input.walletAddress);

  return [
    "Pay3 wants you to sign in with your Stellar wallet.",
    "",
    `Wallet: ${walletAddress}`,
    `Network: ${input.network}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${input.issuedAt.toISOString()}`,
    `Expiration: ${input.expiresAt.toISOString()}`,
  ].join("\n");
}
