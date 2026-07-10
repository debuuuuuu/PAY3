import {
  defaultSessionRules,
  type SessionPolicyRules,
} from "@pay3/session-manager";

export type PolicyDecision =
  | "AUTO_EXECUTE"
  | "PENDING_APPROVAL"
  | "REJECTED";

export type PolicyRequest = {
  action: string;
  asset?: string;
  amount?: string;
  recipient?: string;
};

export type PolicyContext = {
  rules: SessionPolicyRules;
  sessionActive: boolean;
  /** Amount already spent today in the same asset (decimal string). */
  spentToday?: string;
};

export type PolicyResult = {
  decision: PolicyDecision;
  reason: string;
  checks: string[];
};

function parseAmount(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Off-chain three-level policy evaluation (§22).
 * On-chain Soroban enforcement comes later — this is the flexible layer.
 */
export function evaluatePolicy(
  request: PolicyRequest,
  ctx: PolicyContext
): PolicyResult {
  const checks: string[] = [];

  if (!ctx.sessionActive) {
    return {
      decision: "REJECTED",
      reason: "Session is not active (expired or revoked)",
      checks: ["session_active: fail"],
    };
  }
  checks.push("session_active: ok");

  const action = request.action.trim().toLowerCase();
  const allowed = ctx.rules.allowedActions.map((a) => a.toLowerCase());
  if (!allowed.includes(action)) {
    return {
      decision: "REJECTED",
      reason: `Action "${request.action}" is not allowed for this session`,
      checks: [...checks, `action_allowed: fail (${request.action})`],
    };
  }
  checks.push(`action_allowed: ok (${action})`);

  // Read-only tools auto-execute
  if (action === "get_balance" || action === "get_transaction_history") {
    return {
      decision: "AUTO_EXECUTE",
      reason: "Read-only action within session permissions",
      checks: [...checks, "read_only: auto"],
    };
  }

  if (action !== "transfer") {
    return {
      decision: "REJECTED",
      reason: `Unknown financial action "${request.action}"`,
      checks: [...checks, "action_known: fail"],
    };
  }

  // --- transfer checks ---
  const asset = (request.asset ?? "").trim().toUpperCase();
  const ruleAsset = ctx.rules.asset.trim().toUpperCase();
  if (!asset) {
    return {
      decision: "REJECTED",
      reason: "Asset is required for transfer",
      checks: [...checks, "asset: missing"],
    };
  }
  if (asset !== ruleAsset) {
    return {
      decision: "REJECTED",
      reason: `Asset ${asset} not allowed (session allows ${ruleAsset})`,
      checks: [...checks, `asset: fail (${asset} vs ${ruleAsset})`],
    };
  }
  checks.push(`asset: ok (${asset})`);

  if (!request.recipient?.trim()) {
    return {
      decision: "REJECTED",
      reason: "Recipient is required for transfer",
      checks: [...checks, "recipient: missing"],
    };
  }
  checks.push("recipient: present");

  const amount = parseAmount(request.amount);
  if (amount === null || amount <= 0) {
    return {
      decision: "REJECTED",
      reason: "Transfer amount must be a positive number",
      checks: [...checks, "amount: invalid"],
    };
  }
  checks.push(`amount: ${amount}`);

  const perTxMax = parseAmount(ctx.rules.perTxMax);
  if (perTxMax === null) {
    return {
      decision: "REJECTED",
      reason: "Session per-transaction limit is misconfigured",
      checks: [...checks, "per_tx_max: invalid_config"],
    };
  }
  if (amount > perTxMax) {
    return {
      decision: "REJECTED",
      reason: `Amount ${amount} exceeds per-transaction max ${perTxMax} ${ruleAsset}`,
      checks: [...checks, `per_tx_max: fail (${amount} > ${perTxMax})`],
    };
  }
  checks.push(`per_tx_max: ok (<= ${perTxMax})`);

  const dailyBudget = parseAmount(ctx.rules.dailyBudget);
  const spentToday = parseAmount(ctx.spentToday ?? "0") ?? 0;
  if (dailyBudget === null) {
    return {
      decision: "REJECTED",
      reason: "Session daily budget is misconfigured",
      checks: [...checks, "daily_budget: invalid_config"],
    };
  }
  if (spentToday + amount > dailyBudget) {
    return {
      decision: "REJECTED",
      reason: `Amount would exceed daily budget (${spentToday} + ${amount} > ${dailyBudget} ${ruleAsset})`,
      checks: [
        ...checks,
        `daily_budget: fail (spent ${spentToday} + ${amount} > ${dailyBudget})`,
      ],
    };
  }
  checks.push(`daily_budget: ok (spent ${spentToday} + ${amount} <= ${dailyBudget})`);

  const approvalAbove = parseAmount(ctx.rules.approvalAbove);
  if (approvalAbove === null) {
    return {
      decision: "REJECTED",
      reason: "Session approval threshold is misconfigured",
      checks: [...checks, "approval_above: invalid_config"],
    };
  }

  if (amount > approvalAbove) {
    return {
      decision: "PENDING_APPROVAL",
      reason: `Amount ${amount} is above approval threshold ${approvalAbove} ${ruleAsset}`,
      checks: [
        ...checks,
        `approval_threshold: pending (${amount} > ${approvalAbove})`,
      ],
    };
  }

  checks.push(`approval_threshold: ok (<= ${approvalAbove})`);
  return {
    decision: "AUTO_EXECUTE",
    reason: "Transfer within autonomous limits",
    checks,
  };
}

export type PolicyPreset = "conservative" | "balanced" | "custom";

export function policyPreset(name: PolicyPreset): SessionPolicyRules {
  const base = defaultSessionRules();
  if (name === "conservative") {
    return {
      ...base,
      durationHours: 12,
      dailyBudget: "50",
      perTxMax: "10",
      approvalAbove: "5",
    };
  }
  if (name === "balanced") {
    return {
      ...base,
      durationHours: 24,
      dailyBudget: "100",
      perTxMax: "20",
      approvalAbove: "15",
    };
  }
  return base;
}

/** Self-check — fails if three-level model breaks. */
export function policyEngineSelfCheck(): void {
  const rules = policyPreset("balanced");
  const active = { rules, sessionActive: true, spentToday: "0" };

  const read = evaluatePolicy({ action: "get_balance" }, active);
  if (read.decision !== "AUTO_EXECUTE") {
    throw new Error("self-check: read should auto");
  }

  const small = evaluatePolicy(
    { action: "transfer", asset: "XLM", amount: "10", recipient: "GTEST" },
    active
  );
  if (small.decision !== "AUTO_EXECUTE") {
    throw new Error("self-check: small transfer should auto");
  }

  const mid = evaluatePolicy(
    { action: "transfer", asset: "XLM", amount: "16", recipient: "GTEST" },
    active
  );
  if (mid.decision !== "PENDING_APPROVAL") {
    throw new Error("self-check: mid transfer should need approval");
  }

  const big = evaluatePolicy(
    { action: "transfer", asset: "XLM", amount: "50", recipient: "GTEST" },
    active
  );
  if (big.decision !== "REJECTED") {
    throw new Error("self-check: over per-tx should reject");
  }

  const dead = evaluatePolicy(
    { action: "transfer", asset: "XLM", amount: "1", recipient: "GTEST" },
    { ...active, sessionActive: false }
  );
  if (dead.decision !== "REJECTED") {
    throw new Error("self-check: inactive session should reject");
  }
}
