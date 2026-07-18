import { Horizon, Keypair, Networks } from "@stellar/stellar-sdk";

export {
  xlmToStroops,
  stroopsToXlm,
  getNativeSacContractId,
  getRpcServer,
  buildNativeSacTransferOp,
  validateExactSacTransferAuth,
  signSessionAuthEntries,
  buildSimulateSignContractPayment,
  submitSignedSorobanXdr,
  classifySorobanFailure,
  isRetryableSorobanFailure,
  getContractXlmBalance,
  fundContractAccountFromG,
  uploadContractWasm,
  deploySmartAccountContract,
  buildSessionAdminOp,
  rawEd25519PublicKey,
  stellarSorobanSelfCheck,
  DEFAULT_SOROBAN_RPC,
  type SorobanFailureClass,
  type ExpectedTransfer,
} from "./soroban";

export type AssetBalance = {
  asset: string;
  balance: string;
};

export type HorizonPayment = {
  id: string;
  type: string;
  createdAt: string;
  amount: string | null;
  asset: string | null;
  from: string | null;
  to: string | null;
  transactionHash: string | null;
};

const DEFAULT_HORIZON =
  process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";

export function getNetworkPassphrase(): string {
  return (
    process.env.STELLAR_NETWORK_PASSPHRASE ?? Networks.TESTNET
  );
}

/** Interim G-account vs future Soroban contract id (`C…`). */
export type CustodyMode = "interim_g_account" | "soroban_contract";

export function custodyModeFromRef(contractRef: string | null | undefined): CustodyMode {
  if (contractRef && contractRef.startsWith("C")) return "soroban_contract";
  return "interim_g_account";
}

export function getHorizonServer(): Horizon.Server {
  return new Horizon.Server(DEFAULT_HORIZON);
}

export function createAllocationKeypair(): {
  publicKey: string;
  secret: string;
} {
  const kp = Keypair.random();
  return { publicKey: kp.publicKey(), secret: kp.secret() };
}

/** Fund a new testnet account via Friendbot so it exists on-chain. */
export async function fundTestnetAccount(publicKey: string): Promise<void> {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
  );
  if (!res.ok) {
    const text = await res.text();
    // Already funded is fine
    if (!text.includes("createAccountAlreadyExist") && !text.includes("op_already_exists")) {
      throw new Error(`Friendbot failed: ${res.status} ${text.slice(0, 200)}`);
    }
  }
}

export async function getAccountBalances(
  publicKey: string
): Promise<AssetBalance[]> {
  const server = getHorizonServer();
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances.map((b) => {
      if (b.asset_type === "native") {
        return { asset: "XLM", balance: b.balance };
      }
      if ("asset_code" in b) {
        return {
          asset: `${b.asset_code}:${"asset_issuer" in b ? b.asset_issuer.slice(0, 4) : ""}…`,
          balance: b.balance,
        };
      }
      return { asset: b.asset_type, balance: b.balance };
    });
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "response" in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
    if (status === 404) return [];
    throw err;
  }
}

export async function getAccountPayments(
  publicKey: string,
  limit = 25
): Promise<HorizonPayment[]> {
  const server = getHorizonServer();
  try {
    const page = await server
      .payments()
      .forAccount(publicKey)
      .order("desc")
      .limit(limit)
      .call();

    return page.records.map((r) => {
      const rec = r as Horizon.ServerApi.PaymentOperationRecord & {
        amount?: string;
        asset_type?: string;
        asset_code?: string;
        from?: string;
        to?: string;
        transaction_hash?: string;
      };
      let asset: string | null = null;
      if (rec.asset_type === "native") asset = "XLM";
      else if (rec.asset_code) asset = rec.asset_code;

      return {
        id: rec.id,
        type: rec.type,
        createdAt: rec.created_at,
        amount: rec.amount ?? null,
        asset,
        from: rec.from ?? null,
        to: rec.to ?? null,
        transactionHash: rec.transaction_hash ?? null,
      };
    });
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "response" in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
    if (status === 404) return [];
    throw err;
  }
}

export function formatXlm(balance: string): string {
  const n = Number(balance);
  if (Number.isNaN(n)) return balance;
  return n.toFixed(4);
}

/**
 * Send native XLM from a funded account. Secret used only in-memory.
 * Returns Horizon transaction hash.
 */
export async function submitNativePayment(opts: {
  secret: string;
  destination: string;
  amount: string;
}): Promise<{ hash: string }> {
  const { TransactionBuilder, Asset, Operation, BASE_FEE } = await import(
    "@stellar/stellar-sdk"
  );
  const server = getHorizonServer();
  const source = Keypair.fromSecret(opts.secret);
  const account = await server.loadAccount(source.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(
      Operation.payment({
        destination: opts.destination,
        asset: Asset.native(),
        amount: opts.amount,
      })
    )
    .setTimeout(60)
    .build();

  tx.sign(source);

  // Simulate via fee bump path not needed for simple payment; submit directly.
  const result = await server.submitTransaction(tx);
  return { hash: result.hash };
}

/** Classify Horizon/network errors for smart retry (§27). */
export function isTechnicalSubmitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes("insufficient") || lower.includes("op_underfunded")) {
    return false;
  }
  if (lower.includes("op_no_destination") || lower.includes("forbidden")) {
    return false;
  }
  // Network / 5xx / timeout style
  if (
    lower.includes("timeout") ||
    lower.includes("econnreset") ||
    lower.includes("fetch failed") ||
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("504") ||
    lower.includes("network")
  ) {
    return true;
  }
  // Horizon tx_failed with only technical extras is rare; default no retry for op failures
  if (lower.includes("tx_failed") || lower.includes("op_")) {
    return false;
  }
  return true;
}
