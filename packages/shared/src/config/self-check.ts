import assert from "node:assert/strict";
import {
  APPROVAL_EXPIRY_MS,
  TRANSACTION_MAX_RETRIES,
} from "../constants.js";
import { ConfigError } from "./errors.js";
import { parseEncryptionKey, parsePay3Config } from "./parse.js";

const validEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://pay3:pay3@localhost:5432/pay3",
  AUTH_SESSION_SECRET: "test-session-secret-with-32-characters-minimum",
  SESSION_KEY_ENCRYPTION_KEY:
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  CORS_ORIGINS: "http://localhost:3000",
  API_BASE_URL: "http://localhost:3001",
};

const apiConfig = parsePay3Config(validEnv, { service: "api" });
assert.equal(apiConfig.server.port, 3001);
assert.equal(apiConfig.transactions.approvalExpiryMs, APPROVAL_EXPIRY_MS);
assert.equal(apiConfig.transactions.maxRetries, TRANSACTION_MAX_RETRIES);
assert.equal(apiConfig.stellar.network, "testnet");
assert.equal(apiConfig.sessionKeys.encryptionKey.length, 32);

const mcpConfig = parsePay3Config(validEnv, { service: "mcp-server" });
assert.equal(mcpConfig.server.port, 3002);
assert.equal(mcpConfig.mcp.apiBaseUrl, "http://localhost:3001");

assert.throws(
  () => parsePay3Config({ ...validEnv, DATABASE_URL: "" }, { service: "api" }),
  ConfigError,
);

assert.throws(
  () =>
    parsePay3Config(
      { ...validEnv, SESSION_KEY_ENCRYPTION_KEY: "short" },
      { service: "api" },
    ),
  ConfigError,
);

const base64Key = Buffer.alloc(32, 7).toString("base64");
assert.equal(parseEncryptionKey(base64Key).length, 32);

console.log("pay3 config self-check passed");
