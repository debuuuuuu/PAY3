import {
  APPROVAL_EXPIRY_MS,
  DEFAULT_AUTH_CHALLENGE_TTL_MS,
  DEFAULT_SESSION_MAX_AGE_MS,
  STELLAR_DEFAULT_ENDPOINTS,
  STELLAR_NETWORK_PASSPHRASES,
  TRANSACTION_MAX_RETRIES,
} from "../constants.js";
import { ConfigError } from "./errors.js";
import type { LoadPay3ConfigOptions, NodeEnv, Pay3Config, StellarNetwork } from "./types.js";

function requireString(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new ConfigError(`Missing required environment variable: ${name}`);
  }
  return trimmed;
}

function parseNodeEnv(value: string | undefined): NodeEnv {
  const env = (value?.trim() || "development") as NodeEnv;
  if (env !== "development" && env !== "production" && env !== "test") {
    throw new ConfigError(
      `Invalid NODE_ENV "${value}". Expected development, production, or test.`,
    );
  }
  return env;
}

function parsePort(
  value: string | undefined,
  fallback: number,
  name = "PORT",
): number {
  const raw = value?.trim() ?? String(fallback);
  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigError(`Invalid ${name} "${raw}". Expected an integer between 1 and 65535.`);
  }
  return port;
}

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  const raw = value?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ConfigError(`Invalid ${name} "${raw}". Expected a positive integer.`);
  }
  return parsed;
}

function parseStellarNetwork(value: string | undefined): StellarNetwork {
  const network = (value?.trim() || "testnet") as StellarNetwork;
  if (network !== "testnet" && network !== "public") {
    throw new ConfigError(
      `Invalid STELLAR_NETWORK "${value}". Expected testnet or public.`,
    );
  }
  return network;
}

function parseDatabaseUrl(value: string | undefined): string {
  const url = requireString("DATABASE_URL", value);
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    throw new ConfigError(
      "DATABASE_URL must be a PostgreSQL connection string (postgresql://...).",
    );
  }
  return url;
}

function parseSessionSecret(value: string | undefined, nodeEnv: NodeEnv): string {
  const secret = requireString("AUTH_SESSION_SECRET", value);
  if (secret.length < 32) {
    throw new ConfigError(
      "AUTH_SESSION_SECRET must be at least 32 characters.",
    );
  }
  if (
    nodeEnv === "production" &&
    /change-me|example|password|secret/i.test(secret)
  ) {
    throw new ConfigError(
      "AUTH_SESSION_SECRET must be a strong production secret.",
    );
  }
  return secret;
}

export function parseEncryptionKey(value: string | undefined): Buffer {
  const raw = requireString("SESSION_KEY_ENCRYPTION_KEY", value);

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  const decoded = Buffer.from(raw, "base64");
  if (decoded.length !== 32) {
    throw new ConfigError(
      "SESSION_KEY_ENCRYPTION_KEY must be 64 hex characters or base64 encoding exactly 32 bytes.",
    );
  }
  return decoded;
}

function parseOrigins(value: string | undefined, nodeEnv: NodeEnv): string[] {
  const raw = value?.trim();
  if (!raw) {
    if (nodeEnv === "production") {
      throw new ConfigError(
        "CORS_ORIGINS is required in production (comma-separated list of allowed origins).",
      );
    }
    return ["http://localhost:3000"];
  }

  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new ConfigError("CORS_ORIGINS must include at least one origin.");
  }

  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new ConfigError(`Invalid CORS origin "${origin}".`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new ConfigError(`CORS origin "${origin}" must use http or https.`);
    }
  }

  return origins;
}

function parseApiBaseUrl(
  value: string | undefined,
  service: LoadPay3ConfigOptions["service"],
  nodeEnv: NodeEnv,
): string {
  const raw = value?.trim();
  if (!raw) {
    if (service === "mcp-server" && nodeEnv === "production") {
      throw new ConfigError(
        "API_BASE_URL is required for the MCP server in production.",
      );
    }
    return "http://localhost:3001";
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ConfigError(`Invalid API_BASE_URL "${raw}".`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ConfigError("API_BASE_URL must use http or https.");
  }

  return parsed.origin;
}

function parseContractId(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }
  if (!/^[A-Z0-9]{56}$/.test(raw)) {
    throw new ConfigError(
      "SOROBAN_SMART_ACCOUNT_CONTRACT_ID must be a 56-character Stellar contract ID.",
    );
  }
  return raw;
}

export function parsePay3Config(
  env: NodeJS.ProcessEnv,
  options: LoadPay3ConfigOptions,
): Pay3Config {
  const nodeEnv = parseNodeEnv(env.NODE_ENV);
  const stellarNetwork = parseStellarNetwork(env.STELLAR_NETWORK);
  const defaults = STELLAR_DEFAULT_ENDPOINTS[stellarNetwork];
  const defaultPort = options.service === "api" ? 3001 : 3002;

  return {
    nodeEnv,
    service: options.service,
    isProduction: nodeEnv === "production",
    database: {
      url: parseDatabaseUrl(env.DATABASE_URL),
    },
    server: {
      host: env.HOST?.trim() || "0.0.0.0",
      port: parsePort(env.PORT, defaultPort),
    },
    cors: {
      origins: parseOrigins(env.CORS_ORIGINS, nodeEnv),
    },
    auth: {
      challengeTtlMs: parsePositiveInt(
        env.AUTH_CHALLENGE_TTL_MS,
        DEFAULT_AUTH_CHALLENGE_TTL_MS,
        "AUTH_CHALLENGE_TTL_MS",
      ),
      sessionSecret: parseSessionSecret(env.AUTH_SESSION_SECRET, nodeEnv),
      sessionCookieName: env.AUTH_SESSION_COOKIE_NAME?.trim() || "pay3_session",
      sessionMaxAgeMs: parsePositiveInt(
        env.AUTH_SESSION_MAX_AGE_MS,
        DEFAULT_SESSION_MAX_AGE_MS,
        "AUTH_SESSION_MAX_AGE_MS",
      ),
    },
    sessionKeys: {
      encryptionKey: parseEncryptionKey(env.SESSION_KEY_ENCRYPTION_KEY),
    },
    stellar: {
      network: stellarNetwork,
      horizonUrl: env.STELLAR_HORIZON_URL?.trim() || defaults.horizonUrl,
      sorobanRpcUrl: env.STELLAR_SOROBAN_RPC_URL?.trim() || defaults.sorobanRpcUrl,
      networkPassphrase: STELLAR_NETWORK_PASSPHRASES[stellarNetwork],
      smartAccountContractId: parseContractId(env.SOROBAN_SMART_ACCOUNT_CONTRACT_ID),
      usdcSacContractId: parseContractId(env.STELLAR_USDC_SAC_CONTRACT_ID),
    },
    transactions: {
      maxRetries: TRANSACTION_MAX_RETRIES,
      approvalExpiryMs: APPROVAL_EXPIRY_MS,
    },
    mcp: {
      apiBaseUrl: parseApiBaseUrl(env.API_BASE_URL, options.service, nodeEnv),
    },
  };
}
