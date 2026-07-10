import {
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  nativeToScVal,
  rpc,
  scValToNative,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { StellarError } from "./errors.js";
import type { StellarClient } from "./client.js";

/** USDC uses 7 decimal places on Stellar. */
export const USDC_DECIMALS = 7;

export function amountToI128(amount: string, decimals = USDC_DECIMALS): bigint {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new StellarError("SUBMISSION_FAILED", `Invalid amount "${amount}".`);
  }
  const [whole, frac = ""] = trimmed.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole + padded);
}

export function i128ToAmount(value: bigint, decimals = USDC_DECIMALS): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const str = abs.toString().padStart(decimals + 1, "0");
  const whole = str.slice(0, -decimals) || "0";
  const frac = str.slice(-decimals).replace(/0+$/, "");
  const formatted = frac ? `${whole}.${frac}` : whole;
  return negative ? `-${formatted}` : formatted;
}

async function waitForTx(
  server: rpc.Server,
  hash: string,
  attempts = 30,
): Promise<string> {
  for (let i = 0; i < attempts; i += 1) {
    const result = await server.getTransaction(hash);
    if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return hash;
    }
    if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new StellarError(
        "SUBMISSION_FAILED",
        `Soroban transaction failed: ${hash}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new StellarError(
    "SUBMISSION_FAILED",
    `Timed out waiting for Soroban transaction ${hash}.`,
  );
}

export interface VaultTransferParams {
  contractId: string;
  sessionPublicKey: string;
  sessionSecret: string;
  destinationPublicKey: string;
  amount: string;
}

export async function invokeVaultTransfer(
  client: StellarClient,
  params: VaultTransferParams,
): Promise<string> {
  const server = client.soroban;
  const contract = new Contract(params.contractId);
  const source = await server.getAccount(params.sessionPublicKey);
  const amount = amountToI128(params.amount);

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: client.networkPassphrase,
  })
    .addOperation(
      contract.call(
        "transfer",
        new Address(params.sessionPublicKey).toScVal(),
        new Address(params.destinationPublicKey).toScVal(),
        nativeToScVal(amount, { type: "i128" }),
      ),
    )
    .setTimeout(180)
    .build();

  let prepared;
  try {
    prepared = await server.prepareTransaction(tx);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Simulation failed.";
    if (/insufficient|balance/i.test(message)) {
      throw new StellarError("INSUFFICIENT_BALANCE", message);
    }
    throw new StellarError("SUBMISSION_FAILED", message);
  }

  prepared.sign(Keypair.fromSecret(params.sessionSecret));

  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") {
    throw new StellarError(
      "SUBMISSION_FAILED",
      sent.errorResult?.toXDR("base64") ?? "Soroban send failed.",
    );
  }

  return waitForTx(server, sent.hash);
}

export async function getVaultBalance(
  client: StellarClient,
  contractId: string,
  sourcePublicKey: string,
): Promise<string> {
  const server = client.soroban;
  const contract = new Contract(contractId);

  let source;
  try {
    source = await server.getAccount(sourcePublicKey);
  } catch {
    // Session G-account may be unfunded; use the vault contract account for simulation.
    source = await server.getAccount(contractId);
  }

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: client.networkPassphrase,
  })
    .addOperation(contract.call("get_balance"))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(simulated)) {
    throw new StellarError("SUBMISSION_FAILED", "Failed to read vault balance.");
  }

  const retval = simulated.result?.retval;
  if (!retval) {
    return "0";
  }
  const native = scValToNative(retval) as bigint | number | string;
  return i128ToAmount(BigInt(native));
}

export function buildAddSessionArgs(input: {
  sessionPublicKey: string;
  expiresAtUnix: number;
  perTxMax: string;
  dailyMax: string;
}): xdr.ScVal[] {
  return [
    new Address(input.sessionPublicKey).toScVal(),
    nativeToScVal(input.expiresAtUnix, { type: "u64" }),
    nativeToScVal(amountToI128(input.perTxMax), { type: "i128" }),
    nativeToScVal(amountToI128(input.dailyMax), { type: "i128" }),
  ];
}
