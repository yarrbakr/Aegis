import { usd } from "@/lib/format";

// A simple weekly budget meter: total spend vs the user's weekly budget.
// Sage when within budget, coral when over. Server-renderable (no interactivity).
export function BudgetMeter({
  total,
  budget,
}: {
  total: number;
  budget: number | null;
}) {
  if (budget == null || budget <= 0) {
    return (
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-[0.06em] text-[#6B7280]">
            Weekly spend
          </span>
          <span className="font-mono text-sm text-[#1F2933]">{usd(total)}</span>
        </div>
        <p className="mt-2 text-xs text-[#6B7280]">No budget set.</p>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((total / budget) * 100));
  const over = total > budget;
  const fill = over ? "#FF6B6B" : "#4C7B61";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-[0.06em] text-[#6B7280]">
          Weekly budget
        </span>
        <span className="font-mono text-sm text-[#1F2933]">
          {usd(total)} <span className="text-[#6B7280]">/ {usd(budget)}</span>
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#EAF1EC]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(4, pct)}%`, backgroundColor: fill }}
        />
      </div>
      <p className="mt-2 text-xs">
        {over ? (
          <span className="font-medium text-[#E03131]">
            {usd(total - budget)} over budget
          </span>
        ) : (
          <span className="font-medium text-[#2F9E44]">
            {pct}% used · {usd(budget - total)} left
          </span>
        )}
      </p>
    </div>
  );
}
