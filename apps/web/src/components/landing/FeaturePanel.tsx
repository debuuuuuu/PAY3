export type PanelScreen =
  | "flow"
  | "mcp"
  | "policy"
  | "policy-check"
  | "defi"
  | "payments"
  | "network"
  | "config"
  | "policy-setup"
  | "ready";

function PanelBody({ screen, compact = false }: { screen: PanelScreen; compact?: boolean }) {
  switch (screen) {
    case "flow":
      if (compact) {
        return (
          <div className="space-y-2 font-mono text-[10px] leading-relaxed">
            <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
              <p className="text-white/40">claude-desktop</p>
              <p className="mt-1 text-white/80">&gt; pay 5 USDC to John</p>
            </div>
            <div className="rounded-lg border border-white/12 bg-white/[0.04] p-2.5">
              <p className="text-white/90">pay3.wallet.transfer()</p>
              <p className="mt-1 text-white/45">policy ✓ · TX confirmed · 3.2s</p>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-3 font-mono text-[11px] leading-relaxed">
          <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
            <p className="text-white/40">claude-desktop</p>
            <p className="mt-1 text-white/80">&gt; pay 5 USDC to John</p>
          </div>
          <p className="text-center text-white/25">↓ mcp tool call</p>
          <div className="rounded-lg border border-white/12 bg-white/[0.04] p-3">
            <p className="text-white/90">pay3.wallet.transfer()</p>
            <p className="mt-1 text-white/50">amount: 5 USDC · to: john</p>
          </div>
          <p className="text-center text-white/25">↓ policy engine</p>
          <div className="rounded-lg border border-white/12 bg-white/[0.04] p-3">
            <p className="text-white/80">✓ within daily budget</p>
            <p className="text-white/80">✓ session key valid</p>
          </div>
          <p className="text-center text-white/25">↓ settle</p>
          <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
            <p className="text-white/80">TX confirmed · 3.2s</p>
          </div>
        </div>
      );
    case "mcp":
      return (
        <div>
          <p className="font-mono text-[10px] text-white/40">pay3-mcp-server</p>
          <h3 className="mt-3 font-display text-sm font-semibold">Available Tools</h3>
          <div className="mt-3 space-y-1.5">
            {[
              "wallet.get_balance",
              "wallet.transfer",
              "wallet.swap",
              "wallet.supply",
              "payments.payMerchant",
            ].map((tool) => (
              <div
                key={tool}
                className="rounded-md bg-white/5 px-3 py-1.5 font-mono text-[10px] text-white/75"
              >
                {tool}()
              </div>
            ))}
          </div>
        </div>
      );
    case "policy":
      return (
        <div>
          <p className="font-mono text-[10px] text-white/40">session-key.yaml</p>
          <div className="mt-3 space-y-2 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-white/40">duration</span>
              <span>24h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">max_per_tx</span>
              <span>500 USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">daily_budget</span>
              <span>2,000 USDC</span>
            </div>
            <div className="border-t border-white/10 pt-2 text-white/45">
              allowed: [blend, phoenix, aquarius]
            </div>
            <div className="text-red-400/80">blocked: [withdraw, unknown_contracts]</div>
          </div>
        </div>
      );
    case "policy-check":
      return (
        <div>
          <p className="font-mono text-[10px] text-white/40">policy-engine</p>
          <div className="mt-3 space-y-2">
            {[
              { rule: "Daily budget", ok: true },
              { rule: "Per-tx limit", ok: true },
              { rule: "Allowed protocol", ok: true },
              { rule: "Session expiry", ok: true },
              { rule: "Unknown contract", ok: false, blocked: true },
            ].map((r) => (
              <div
                key={r.rule}
                className={`flex items-center justify-between rounded-md px-3 py-1.5 text-[10px] ${
                  r.blocked ? "bg-red-500/10 text-red-400" : "bg-white/[0.06] text-white/75"
                }`}
              >
                <span>{r.rule}</span>
                <span>{r.blocked ? "✕ blocked" : "✓ pass"}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "defi":
      return (
        <div>
          <p className="font-mono text-[10px] text-white/40">portfolio.rebalance()</p>
          <div className="mt-3 rounded-lg bg-white/5 p-3">
            <p className="text-[10px] text-white/40">Total managed</p>
            <p className="text-xl font-semibold">$11,250.56</p>
            <p className="text-[10px] text-white/55">+ $150.56 today</p>
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <p className="text-[10px] font-medium">Blend · Supply USDC</p>
              <p className="text-[9px] text-white/40">APY 8.2%</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <p className="text-[10px] font-medium">Phoenix · XLM → USDC</p>
              <p className="text-[9px] text-white/40">Rebalance trigger</p>
            </div>
          </div>
        </div>
      );
    case "payments":
      return (
        <div>
          <p className="font-mono text-[10px] text-white/40">payments.payMerchant()</p>
          <div className="mt-3 rounded-lg bg-white/5 p-3">
            <p className="text-[10px] text-white/40">Merchant</p>
            <p className="font-medium">Fresh Farms Co-op</p>
            <p className="mt-2 text-[10px] text-white/40">Amount</p>
            <p className="text-lg font-semibold">85.52 USDC</p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px]">
            <span className="rounded bg-white/10 px-2 py-0.5 text-white/70">policy ✓</span>
            <span className="text-white/40">→ settled · USDC</span>
          </div>
        </div>
      );
    case "network":
      return (
        <div>
          <p className="font-mono text-[10px] text-white/40">agent-activity.log</p>
          <div className="mt-3 space-y-2 text-[10px]">
            {[
              { agent: "claude", action: "wallet.swap", status: "ok" },
              { agent: "cursor", action: "wallet.supply", status: "ok" },
              { agent: "custom", action: "portfolio.rebalance", status: "ok" },
            ].map((entry) => (
              <div key={entry.action} className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2">
                <span className="text-white/70">{entry.agent}</span>
                <span className="text-white/50">{entry.action}()</span>
                <span className="ml-auto text-white/60">✓</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "config":
      return (
        <div>
          <p className="text-[11px] font-medium text-white/40">Allocation jar</p>
          <p className="mt-1 font-mono text-[11px] text-white/35">GABC…XOQ4</p>
          <div className="mt-3 space-y-2">
            {[
              { asset: "XLM", amount: "12.40" },
              { asset: "USDC", amount: "5.00" },
            ].map((row) => (
              <div
                key={row.asset}
                className="flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2.5"
              >
                <span className="text-[13px] font-medium text-white/90">{row.asset}</span>
                <span className="font-mono text-[13px] text-white/70">{row.amount}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "policy-setup":
      return (
        <div>
          <p className="text-[11px] font-medium text-white/40">Allowed assets</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["XLM", "USDC"].map((asset) => (
              <span
                key={asset}
                className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium text-white"
              >
                {asset}
              </span>
            ))}
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[12px] font-medium text-white/40">
              + more
            </span>
          </div>
          <div className="mt-3 space-y-2 text-[12px]">
            <div className="flex justify-between rounded-xl bg-white/[0.06] px-3 py-2.5">
              <span className="text-white/45">Daily cap</span>
              <span className="text-white/85">2,000</span>
            </div>
            <div className="flex justify-between rounded-xl bg-white/[0.06] px-3 py-2.5">
              <span className="text-white/45">Per tx</span>
              <span className="text-white/85">200</span>
            </div>
          </div>
        </div>
      );
    case "ready":
      return (
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[11px] text-white">
              ✓
            </span>
            <p className="text-[13px] font-medium text-white/90">Agent connected</p>
          </div>
          <div className="mt-3 space-y-2 font-mono text-[11px]">
            <p className="rounded-xl bg-white/[0.06] px-3 py-2.5 text-white/70">
              &gt; pay Hurain 0.5 XLM
            </p>
            <p className="rounded-xl bg-white/[0.06] px-3 py-2.5 text-white/70">
              &gt; pay Debjit 5 USDC
            </p>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function FeaturePanel({
  screen,
  title,
  className = "",
  embedded = false,
  nested = false,
}: {
  screen: PanelScreen;
  title?: string;
  className?: string;
  embedded?: boolean;
  nested?: boolean;
}) {
  const labels: Record<PanelScreen, string> = {
    flow: "pay3 — live transaction",
    mcp: "pay3-mcp-server",
    policy: "session-keys",
    "policy-check": "policy-engine",
    defi: "defi-integrations",
    payments: "merchant-payments",
    network: "agent-network",
    config: "jar",
    "policy-setup": "session",
    ready: "cursor",
  };

  const shell = nested
    ? `w-full overflow-hidden rounded-[22px] bg-[#1c1c1e] ${className}`
    : embedded
      ? `w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 ${className}`
      : `w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-pay3-gray-900 shadow-2xl ${className}`;

  return (
    <div className={shell}>
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[12px] font-medium tracking-[-0.01em] text-white/40">
          {title ?? labels[screen]}
        </span>
      </div>
      <div className={embedded ? "p-3" : nested ? "min-h-[11.5rem] p-4" : "p-5"}>
        <PanelBody screen={screen} compact={embedded && screen === "flow"} />
      </div>
    </div>
  );
}
