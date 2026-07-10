import type { Pay3Config } from "@pay3/shared";
import { Horizon, Networks, rpc } from "@stellar/stellar-sdk";

export class StellarClient {
  readonly horizon: Horizon.Server;
  readonly soroban: rpc.Server;
  readonly networkPassphrase: string;
  readonly smartAccountContractId: string | null;
  readonly usdcSacContractId: string | null;

  constructor(config: Pick<Pay3Config, "stellar">) {
    this.horizon = new Horizon.Server(config.stellar.horizonUrl);
    this.soroban = new rpc.Server(config.stellar.sorobanRpcUrl, {
      allowHttp: config.stellar.sorobanRpcUrl.startsWith("http://"),
    });
    this.networkPassphrase = config.stellar.networkPassphrase;
    this.smartAccountContractId = config.stellar.smartAccountContractId;
    this.usdcSacContractId = config.stellar.usdcSacContractId;
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
