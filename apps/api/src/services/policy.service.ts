import { PolicyPreset, TransactionAction } from "@pay3/database";
import { Decimal } from "@prisma/client/runtime/library";
import type { ServiceContext } from "./context.js";

const PRESETS = {
  [PolicyPreset.CONSERVATIVE]: {
    dailyBudget: "100",
    perTransactionMax: "20",
    manualApprovalThreshold: "15",
    sessionDurationHours: 24,
    allowedAssets: ["USDC", "XLM"],
    allowedActions: [TransactionAction.CHECK_BALANCE, TransactionAction.TRANSFER, TransactionAction.VIEW_TRANSACTION_HISTORY],
  },
  [PolicyPreset.BALANCED]: {
    dailyBudget: "500",
    perTransactionMax: "100",
    manualApprovalThreshold: "250",
    sessionDurationHours: 168,
    allowedAssets: ["USDC", "XLM"],
    allowedActions: [TransactionAction.CHECK_BALANCE, TransactionAction.TRANSFER, TransactionAction.VIEW_TRANSACTION_HISTORY],
  },
  [PolicyPreset.DEFI]: {
    dailyBudget: "1000",
    perTransactionMax: "250",
    manualApprovalThreshold: "500",
    sessionDurationHours: 168,
    allowedAssets: ["USDC", "XLM"],
    allowedActions: [TransactionAction.CHECK_BALANCE, TransactionAction.TRANSFER, TransactionAction.VIEW_TRANSACTION_HISTORY],
  },
} as const;

export class PolicyAppService {
  constructor(private readonly ctx: ServiceContext) {}

  async createPolicy(input: {
    userId: string;
    name: string;
    preset: PolicyPreset;
    dailyBudget?: string;
    perTransactionMax?: string;
    manualApprovalThreshold?: string;
    sessionDurationHours?: number;
    allowedAssets?: string[];
    allowedActions?: TransactionAction[];
    monthlyBudget?: string | null;
    allowedRecipientIds?: string[];
    rateLimitPerMinute?: number | null;
  }) {
    const presetValues =
      input.preset === PolicyPreset.CUSTOM
        ? {
            dailyBudget: input.dailyBudget ?? "100",
            perTransactionMax: input.perTransactionMax ?? "20",
            manualApprovalThreshold: input.manualApprovalThreshold ?? "15",
            sessionDurationHours: input.sessionDurationHours ?? 24,
            allowedAssets: input.allowedAssets ?? ["USDC", "XLM"],
            allowedActions:
              input.allowedActions ?? [
                TransactionAction.CHECK_BALANCE,
                TransactionAction.TRANSFER,
                TransactionAction.VIEW_TRANSACTION_HISTORY,
              ],
          }
        : PRESETS[input.preset];

    return this.ctx.prisma.policy.create({
      data: {
        userId: input.userId,
        name: input.name,
        preset: input.preset,
        dailyBudget: new Decimal(presetValues.dailyBudget),
        monthlyBudget: input.monthlyBudget ? new Decimal(input.monthlyBudget) : null,
        perTransactionMax: new Decimal(presetValues.perTransactionMax),
        manualApprovalThreshold: new Decimal(presetValues.manualApprovalThreshold),
        sessionDurationHours: presetValues.sessionDurationHours,
        allowedAssets: [...presetValues.allowedAssets],
        allowedActions: [...presetValues.allowedActions],
        allowedRecipientIds: input.allowedRecipientIds ?? [],
        rateLimitPerMinute: input.rateLimitPerMinute ?? null,
      },
    });
  }

  async listPolicies(userId: string) {
    return this.ctx.prisma.policy.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPolicy(userId: string, policyId: string) {
    return this.ctx.prisma.policy.findFirst({
      where: { id: policyId, userId, isActive: true },
    });
  }
}
