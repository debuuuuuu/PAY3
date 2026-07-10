import { config as loadDotenv } from "dotenv";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { findMonorepoRoot } from "./monorepo-root.js";

export function bootstrapEnvFiles(): void {
  const root = findMonorepoRoot();
  const envFiles = [
    join(root, ".env"),
    join(root, ".env.local"),
    join(root, `.env.${process.env.NODE_ENV ?? "development"}`),
  ];

  for (const file of envFiles) {
    if (existsSync(file)) {
      loadDotenv({ path: file, override: false });
    }
  }
}
