import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function findMonorepoRoot(startDir: string = process.cwd()): string {
  let dir = startDir;

  while (true) {
    const packageJsonPath = join(dir, "package.json");
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
          workspaces?: unknown;
        };
        if (pkg.workspaces) {
          return dir;
        }
      } catch {
        // keep walking
      }
    }

    const parent = dirname(dir);
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
}
