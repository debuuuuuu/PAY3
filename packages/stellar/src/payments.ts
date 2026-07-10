import {
  Asset,
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { StellarError } from "./errors.js";
import type { StellarClient } from "./client.js";

export interface AssetBalance {
  asset: string;
  balance: string;
}

function formatAsset(assetType: string, assetCode?: string, assetIssuer?: string): string {
  if (assetType === "native") {
    return "XLM";
  }
  if (assetCode) {
    return assetIssuer ? `${assetCode}:${assetIssuer}` : assetCode;
  }
  return assetType;
}

export async function getAccountBalances(
  client: StellarClient,
  publicKey: string,
): Promise<AssetBalance[]> {
  try {
    const account = await client.horizon.loadAccount(publicKey);
    return account.balances.map((entry) => ({
      asset: formatAsset(
        entry.asset_type,
        "asset_code" in entry ? entry.asset_code : undefined,
        "asset_issuer" in entry ? entry.asset_issuer : undefined,
      ),
      balance: entry.balance,
    }));
  } catch (error) {
    if (error instanceof Error && /not found/i.test(error.message)) {
      throw new StellarError("ACCOUNT_NOT_FOUND", `Stellar account ${publicKey} not found.`);
    }
    throw error;
  }
}

export async function getAssetBalance(
  client: StellarClient,
  publicKey: string,
  assetCode: string,
): Promise<string> {
  const balances = await getAccountBalances(client, publicKey);
  const asset = assetCode.trim().toUpperCase();
  const match = balances.find((entry) => entry.asset.toUpperCase() === asset);
  return match?.balance ?? "0";
}

export interface PaymentParams {
  sourcePublicKey: string;
  destinationPublicKey: string;
  assetCode: string;
  amount: string;
  signerSecret: string;
}

export async function buildAndSubmitPayment(
  client: StellarClient,
  params: PaymentParams,
): Promise<string> {
  const source = await client.horizon.loadAccount(params.sourcePublicKey);
  const asset =
    params.assetCode.toUpperCase() === "XLM"
      ? Asset.native()
      : new Asset(
          params.assetCode.toUpperCase(),
          process.env.STELLAR_USDC_ISSUER?.trim() ||
            "GBBD47IF6LOC7WWYN6FHAIK6G3WVGAZNPTJKXW7BPEIONV4A7OXBA",
        );

  const transaction = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: client.networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: params.destinationPublicKey,
        asset,
        amount: params.amount,
      }),
    )
    .setTimeout(180)
    .build();

  const signer = Keypair.fromSecret(params.signerSecret);
  transaction.sign(signer);

  try {
    const result = await client.horizon.submitTransaction(transaction);
    return result.hash;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission failed.";
    if (/insufficient/i.test(message)) {
      throw new StellarError("INSUFFICIENT_BALANCE", message);
    }
    throw new StellarError("SUBMISSION_FAILED", message);
  }
}
