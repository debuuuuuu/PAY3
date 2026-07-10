import { bootstrapEnvFiles } from "./load-env.js";
import { parsePay3Config } from "./parse.js";
import type { LoadPay3ConfigOptions, Pay3Config } from "./types.js";

let envBootstrapped = false;

function ensureEnvLoaded(): void {
  if (!envBootstrapped) {
    bootstrapEnvFiles();
    envBootstrapped = true;
  }
}

export function loadPay3Config(options: LoadPay3ConfigOptions): Pay3Config {
  ensureEnvLoaded();
  return parsePay3Config(process.env, options);
}

export { ConfigError } from "./errors.js";
export { parseEncryptionKey, parsePay3Config } from "./parse.js";
export type {
  LoadPay3ConfigOptions,
  NodeEnv,
  Pay3Config,
  Pay3Service,
  StellarNetwork,
} from "./types.js";
