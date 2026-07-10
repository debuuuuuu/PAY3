import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapEnvFiles } from "@pay3/shared";

bootstrapEnvFiles();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://pay3:pay3@127.0.0.1:5432/pay3?schema=public";
}

const packageRoot = dirname(fileURLToPath(import.meta.url));

execFileSync("npx", ["prisma", "validate"], {
  stdio: "inherit",
  shell: true,
  cwd: join(packageRoot, ".."),
});
