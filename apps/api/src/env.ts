import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const apiDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
config({ path: resolve(apiDir, ".env") });
config({ path: resolve(apiDir, "../../.env") });
