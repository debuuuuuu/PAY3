import { loadPay3Config, type Pay3Config } from "@pay3/shared";

let cached: Pay3Config | null = null;

export function getConfig(): Pay3Config {
  if (!cached) {
    cached = loadPay3Config({ service: "mcp-server" });
  }
  return cached;
}

/** Resets cached config — for tests only. */
export function resetConfig(): void {
  cached = null;
}

export type { Pay3Config };
