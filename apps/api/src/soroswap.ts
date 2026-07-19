/**
 * Soroswap aggregator client: quote (+ optional build/send for execute_swap).
 * Secrets never leave the API signing path.
 */
import "./env.js";

const DEFAULT_API_URL = "https://api.soroswap.finance";
const DEFAULT_NETWORK = "testnet";
const DEFAULT_SLIPPAGE_BPS = 50;

/** Testnet SAC contract IDs (Soroswap examples). Pools may be empty at times. */
export const TESTNET_ASSET_CONTRACTS: Record<string, string> = {
  XLM: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  USDC: "CDWEFYYHMGEZEFC5TBUDXM3IJJ7K7W5BDGE765UIYQEV4JFWDOLSTOEK",
};

/** Mainnet SAC ids (native XLM via Asset.native().contractId + Circle USDC). */
export const MAINNET_ASSET_CONTRACTS: Record<string, string> = {
  XLM: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
  USDC: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
};

const AGG_PROTOCOLS = ["soroswap", "phoenix", "aqua"] as const;

export type TradeType = "EXACT_IN" | "EXACT_OUT";

export type SwapQuoteRequest = {
  assetIn: string;
  assetOut: string;
  /** Human decimal string, e.g. "1.5" */
  amount: string;
  tradeType?: TradeType;
  /** Slippage in basis points (default 50 = 0.5%). */
  slippageBps?: number;
};

export type SwapQuoteResult = {
  network: string;
  tradeType: TradeType;
  assetIn: string;
  assetOut: string;
  assetInContract: string;
  assetOutContract: string;
  amountIn: string;
  amountOut: string;
  amountInDecimal: string;
  amountOutDecimal: string;
  protocols: string[];
  note: string;
  slippageBps: number;
  /** Trimmed aggregator payload for debugging (no secrets). */
  route: unknown;
};

export type SwapQuoteBundle = {
  result: SwapQuoteResult;
  /** Full Soroswap quote object — required for /quote/build. */
  raw: Record<string, unknown>;
};

export class SoroswapError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "SoroswapError";
    this.status = status;
  }
}

export function getSoroswapConfig(): {
  apiKey: string | null;
  apiUrl: string;
  network: string;
} {
  const apiKey = process.env.SOROSWAP_API_KEY?.trim() || null;
  const apiUrl = (
    process.env.SOROSWAP_API_URL?.trim() || DEFAULT_API_URL
  ).replace(/\/$/, "");
  const network =
    process.env.SOROSWAP_NETWORK?.trim().toLowerCase() || DEFAULT_NETWORK;
  return { apiKey, apiUrl, network };
}

/** Resolve symbol (XLM/USDC) or raw C-address to contract id. */
export function resolveAssetContract(
  asset: string,
  network = DEFAULT_NETWORK
): string {
  const a = asset.trim();
  if (!a) throw new SoroswapError("asset is required", 400);
  if (/^C[A-Z0-9]{55}$/i.test(a)) return a.toUpperCase();

  const sym = a.toUpperCase();
  const table =
    network === "mainnet" ? MAINNET_ASSET_CONTRACTS : TESTNET_ASSET_CONTRACTS;
  if (table[sym]) return table[sym];
  throw new SoroswapError(
    `Unknown asset "${asset}". Use XLM, USDC, or a C… contract id on ${network}.`,
    400
  );
}

/**
 * Human decimal → integer stroops (7 decimals for native-style SAC).
 * Rejects scientific notation / non-finite.
 */
export function decimalToStroops(amount: string, decimals = 7): string {
  const t = amount.trim();
  if (!t || !/^\d+(\.\d+)?$/.test(t)) {
    throw new SoroswapError("amount must be a positive decimal string", 400);
  }
  const [whole, frac = ""] = t.split(".");
  if (frac.length > decimals) {
    throw new SoroswapError(
      `amount has more than ${decimals} decimal places`,
      400
    );
  }
  const fracPad = frac.padEnd(decimals, "0");
  const raw = `${whole}${fracPad}`.replace(/^0+(?=\d)/, "");
  if (raw === "0" || raw === "") {
    throw new SoroswapError("amount must be greater than zero", 400);
  }
  return raw;
}

export function stroopsToDecimal(stroops: string, decimals = 7): string {
  const s = stroops.trim().replace(/^-/, "");
  if (!/^\d+$/.test(s)) return stroops;
  const pad = s.padStart(decimals + 1, "0");
  const whole = pad.slice(0, -decimals) || "0";
  const frac = pad.slice(-decimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

function pickAmountField(
  raw: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "string" && v.length) return v;
    if (typeof v === "number" && Number.isFinite(v)) return String(Math.trunc(v));
    if (typeof v === "bigint") return v.toString();
  }
  return null;
}

function normalizeSlippageBps(value: number | undefined): number {
  if (value === undefined || value === null) return DEFAULT_SLIPPAGE_BPS;
  if (!Number.isFinite(value) || value < 0 || value > 5000) {
    throw new SoroswapError("slippage_bps must be between 0 and 5000", 400);
  }
  return Math.trunc(value);
}

async function soroswapPost(
  path: string,
  body: unknown
): Promise<Record<string, unknown>> {
  const { apiKey, apiUrl, network } = getSoroswapConfig();
  if (!apiKey) {
    throw new SoroswapError(
      "SOROSWAP_API_KEY is not configured — swap quotes unavailable",
      503
    );
  }
  const url = `${apiUrl}${path}?network=${encodeURIComponent(network)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const parsed = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const detail =
      typeof parsed.detail === "string"
        ? parsed.detail
        : typeof parsed.title === "string"
          ? parsed.title
          : null;
    const msg =
      detail ??
      (typeof parsed.message === "string"
        ? parsed.message
        : typeof parsed.error === "string"
          ? parsed.error
          : `Soroswap ${path} failed (${res.status})`);
    throw new SoroswapError(
      msg,
      res.status >= 400 && res.status < 600 ? res.status : 502
    );
  }
  return parsed;
}

function toQuoteResult(
  req: SwapQuoteRequest,
  body: Record<string, unknown>,
  amountStroops: string,
  tradeType: TradeType,
  slippageBps: number,
  assetInContract: string,
  assetOutContract: string,
  network: string
): SwapQuoteResult {
  const amountIn =
    pickAmountField(body, ["amountIn", "amount_in", "otherAmountThreshold"]) ??
    (tradeType === "EXACT_IN" ? amountStroops : null);
  const amountOut = pickAmountField(body, [
    "amountOut",
    "amount_out",
    "expectedAmountOut",
  ]);

  if (!amountIn || !amountOut) {
    throw new SoroswapError(
      "Soroswap quote response missing amountIn/amountOut",
      502
    );
  }

  const protocolsUsed = Array.isArray(body.protocols)
    ? body.protocols.map(String)
    : Array.isArray(body.platform)
      ? [String(body.platform)]
      : [...AGG_PROTOCOLS];

  return {
    network,
    tradeType,
    assetIn: req.assetIn.trim().toUpperCase(),
    assetOut: req.assetOut.trim().toUpperCase(),
    assetInContract,
    assetOutContract,
    amountIn,
    amountOut,
    amountInDecimal: stroopsToDecimal(amountIn),
    amountOutDecimal: stroopsToDecimal(amountOut),
    protocols: protocolsUsed,
    note: "Read-only quote — use execute_swap to trade (opt-in session action).",
    slippageBps,
    route: {
      tradeType: body.tradeType ?? tradeType,
      rawPaths: body.rawPaths ?? body.routes ?? body.path ?? null,
      platformCost: body.platformCost ?? null,
      gaslessTrustline: body.gaslessTrustline ?? null,
    },
  };
}

/** Quote + raw payload for build. */
export async function getSwapQuoteBundle(
  req: SwapQuoteRequest
): Promise<SwapQuoteBundle> {
  const { network } = getSoroswapConfig();
  const tradeType: TradeType =
    req.tradeType === "EXACT_OUT" ? "EXACT_OUT" : "EXACT_IN";
  const slippageBps = normalizeSlippageBps(req.slippageBps);
  const assetInContract = resolveAssetContract(req.assetIn, network);
  const assetOutContract = resolveAssetContract(req.assetOut, network);
  if (assetInContract === assetOutContract) {
    throw new SoroswapError("asset_in and asset_out must differ", 400);
  }

  const amountStroops = decimalToStroops(req.amount);
  const body = await soroswapPost("/quote", {
    assetIn: assetInContract,
    assetOut: assetOutContract,
    amount: amountStroops,
    tradeType,
    protocols: [...AGG_PROTOCOLS],
    slippageBps,
  });

  return {
    result: toQuoteResult(
      req,
      body,
      amountStroops,
      tradeType,
      slippageBps,
      assetInContract,
      assetOutContract,
      network
    ),
    raw: body,
  };
}

export async function getSwapQuote(
  req: SwapQuoteRequest
): Promise<SwapQuoteResult> {
  const { result } = await getSwapQuoteBundle(req);
  return result;
}

/** Build unsigned XDR from a full quote object. */
export async function buildSwapTransaction(opts: {
  quote: Record<string, unknown>;
  from: string;
  to?: string;
}): Promise<{ xdr: string }> {
  const from = opts.from.trim();
  if (!from.startsWith("G")) {
    throw new SoroswapError("swap from must be a G… allocation account", 400);
  }
  const to = (opts.to ?? from).trim();
  const body = await soroswapPost("/quote/build", {
    quote: opts.quote,
    from,
    to,
  });
  const xdr =
    typeof body.xdr === "string"
      ? body.xdr
      : typeof body.XDR === "string"
        ? body.XDR
        : null;
  if (!xdr) {
    throw new SoroswapError("Soroswap build response missing xdr", 502);
  }
  return { xdr };
}

/** Broadcast a signed swap XDR via Soroswap /send. */
export async function sendSignedSwap(
  signedXdr: string
): Promise<{ txHash: string }> {
  const xdr = signedXdr.trim();
  if (!xdr) throw new SoroswapError("signed xdr required", 400);
  const body = await soroswapPost("/send", { xdr });
  const txHash =
    typeof body.txHash === "string"
      ? body.txHash
      : typeof body.hash === "string"
        ? body.hash
        : typeof body.transactionHash === "string"
          ? body.transactionHash
          : null;
  if (!txHash) {
    throw new SoroswapError("Soroswap send response missing txHash", 502);
  }
  return { txHash };
}

/** Offline self-check — no network. */
export function soroswapSelfCheck(): boolean {
  const xlm = resolveAssetContract("XLM", "testnet");
  if (!xlm.startsWith("C")) throw new Error("XLM map failed");
  const usdc = resolveAssetContract("usdc", "testnet");
  if (usdc === xlm) throw new Error("USDC map failed");
  const raw = resolveAssetContract(xlm, "testnet");
  if (raw !== xlm) throw new Error("C-id passthrough failed");
  if (decimalToStroops("1") !== "10000000") throw new Error("1 XLM stroops");
  if (decimalToStroops("0.5") !== "5000000") throw new Error("0.5 stroops");
  if (stroopsToDecimal("15000000") !== "1.5") throw new Error("stroops→decimal");
  try {
    decimalToStroops("0");
    throw new Error("zero should fail");
  } catch (e) {
    if (!(e instanceof SoroswapError)) throw e;
  }
  try {
    normalizeSlippageBps(-1);
    throw new Error("bad slippage should fail");
  } catch (e) {
    if (!(e instanceof SoroswapError)) throw e;
  }
  return true;
}

if (process.argv[1]?.includes("soroswap")) {
  console.assert(soroswapSelfCheck(), "soroswap self-check failed");
  console.log("soroswap self-check ok");
}
