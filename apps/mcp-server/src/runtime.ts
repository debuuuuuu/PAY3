import { prisma } from "@pay3/database";
import { createAiSessionManager } from "@pay3/session-manager";
import type { Pay3Config } from "@pay3/shared";
import { createStellarClient } from "@pay3/stellar";
import { createTransactionEngine } from "@pay3/transaction-engine";
import { McpTransferService } from "./transfer.js";

export interface McpRuntime {
  transfer: McpTransferService;
}

export function createMcpRuntime(config: Pay3Config): McpRuntime {
  const stellar = createStellarClient(config);
  const aiSessions = createAiSessionManager(prisma, config);
  const transactions = createTransactionEngine(prisma, config, aiSessions);

  return {
    transfer: new McpTransferService({
      prisma,
      stellar,
      aiSessions,
      transactions,
    }),
  };
}
