export type NodeEnv = "development" | "production" | "test";
export type StellarNetwork = "testnet" | "public";
export type Pay3Service = "api" | "mcp-server";

export interface Pay3Config {
  nodeEnv: NodeEnv;
  service: Pay3Service;
  isProduction: boolean;
  database: {
    url: string;
  };
  server: {
    host: string;
    port: number;
  };
  cors: {
    origins: string[];
  };
  auth: {
    challengeTtlMs: number;
    sessionSecret: string;
    sessionCookieName: string;
    sessionMaxAgeMs: number;
  };
  sessionKeys: {
    encryptionKey: Buffer;
  };
  stellar: {
    network: StellarNetwork;
    horizonUrl: string;
    sorobanRpcUrl: string;
    networkPassphrase: string;
    smartAccountContractId: string | null;
  };
  transactions: {
    maxRetries: number;
    approvalExpiryMs: number;
  };
  mcp: {
    apiBaseUrl: string;
  };
}

export interface LoadPay3ConfigOptions {
  service: Pay3Service;
}
