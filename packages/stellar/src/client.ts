import type { Pay3Config } from "@pay3/shared";
import { Horizon, Networks } from "@stellar/stellar-sdk";

export class StellarClient {
  readonly horizon: Horizon.Server;
  readonly networkPassphrase: string;

  constructor(config: Pick<Pay3Config, "stellar">) {
    this.horizon = new Horizon.Server(config.stellar.horizonUrl);
    this.networkPassphrase = config.stellar.networkPassphrase;
  }

  network(): string {
    return this.networkPassphrase === Networks.PUBLIC
      ? Networks.PUBLIC
      : Networks.TESTNET;
  }
}

export function createStellarClient(config: Pick<Pay3Config, "stellar">): StellarClient {
  return new StellarClient(config);
}
