// Currency formatting. Aegis prices everything in US dollars (USD) — one place
// so the whole app (meal cards, budget meters, dashboards) stays consistent.

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

/** Format a number as USD, e.g. 3.5 → "$3.50", 120 → "$120.00". */
export function usd(amount: number | null | undefined): string {
  return USD.format(Number(amount ?? 0));
}

/**
 * Approximate USD — prefixes with "~" because costs are AI estimates, not
 * quotes. e.g. 68.5 → "~$68.50".
 */
export function usdApprox(amount: number | null | undefined): string {
  return `~${usd(amount)}`;
}
