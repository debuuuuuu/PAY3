import type { StellarNetwork as ConfigNetwork } from "@pay3/shared";
import { StellarNetwork } from "@pay3/database";

export function toPrismaNetwork(network: ConfigNetwork): StellarNetwork {
  return network === "testnet" ? StellarNetwork.TESTNET : StellarNetwork.PUBLIC;
}

export function normalizeWalletAddress(address: string): string {
  return address.trim().toUpperCase();
}
