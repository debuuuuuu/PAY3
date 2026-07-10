import { prisma } from "@pay3/database";
import { createAiSessionManager } from "@pay3/session-manager";
import type { Pay3Config } from "@pay3/shared";
import { createTransactionEngine } from "@pay3/transaction-engine";
import {
  APPROVAL_EXPIRY_POLL_MS,
  RETRY_TRANSFER_POLL_MS,
  SESSION_EXPIRY_POLL_MS,
} from "./constants.js";
import { expirePendingApprovals } from "./expire-approvals.js";
import { expireAiSessions } from "./expire-sessions.js";
import { retryStuckTransfers } from "./retry-transfers.js";

export interface WorkerRuntime {
  transactions: ReturnType<typeof createTransactionEngine>;
}

export function createWorkerRuntime(config: Pay3Config): WorkerRuntime {
  const aiSessions = createAiSessionManager(prisma, config);
  const transactions = createTransactionEngine(prisma, config, aiSessions);
  return { transactions };
}

export interface WorkerHandles {
  stop: () => void;
}

export function startWorkers(runtime: WorkerRuntime): WorkerHandles {
  const runApprovalExpiry = () => {
    void expirePendingApprovals(prisma).catch((error) => {
      console.error("approval expiry worker failed:", error);
    });
  };

  const runSessionExpiry = () => {
    void expireAiSessions(prisma).catch((error) => {
      console.error("session expiry worker failed:", error);
    });
  };

  const runRetries = () => {
    void retryStuckTransfers(prisma, runtime.transactions).catch((error) => {
      console.error("retry worker failed:", error);
    });
  };

  runApprovalExpiry();
  runSessionExpiry();
  runRetries();

  const approvalTimer = setInterval(runApprovalExpiry, APPROVAL_EXPIRY_POLL_MS);
  const sessionTimer = setInterval(runSessionExpiry, SESSION_EXPIRY_POLL_MS);
  const retryTimer = setInterval(runRetries, RETRY_TRANSFER_POLL_MS);

  return {
    stop() {
      clearInterval(approvalTimer);
      clearInterval(sessionTimer);
      clearInterval(retryTimer);
    },
  };
}
