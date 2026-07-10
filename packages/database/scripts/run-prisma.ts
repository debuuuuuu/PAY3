import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapEnvFiles } from "@pay3/shared";

bootstrapEnvFiles();

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: tsx scripts/run-prisma.ts <prisma-cli-args...>");
  process.exit(1);
}

execFileSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  shell: true,
  cwd: packageRoot,
  env: process.env,
});
