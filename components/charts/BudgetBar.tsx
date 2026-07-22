"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { DailyCost } from "@/lib/plan-stats";

// Per-day meal cost across the week. Bars are sage; a day that exceeds the
// daily budget share turns coral, and a dashed coral line marks that threshold.
export function BudgetBar({
  data,
  dailyBudget,
}: {
  data: DailyCost[];
  dailyBudget?: number | null;
}) {
  const hasData = data.some((d) => d.cost > 0);
  if (!hasData) {
    return (
      <div className="flex h-[200px] items-center justify-center text-xs text-[#6B7280]">
        No cost data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "#6B7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6B7280" }}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(v: number) => `$${v}`}
        />
        <Tooltip
          cursor={{ fill: "rgba(76,123,97,0.08)" }}
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Cost"]}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #E5E7EB",
            fontSize: 12,
          }}
        />
        {dailyBudget && dailyBudget > 0 ? (
          <ReferenceLine
            y={dailyBudget}
            stroke="#FA5252"
            strokeDasharray="4 4"
            label={{
              value: "daily budget",
              fontSize: 10,
              fill: "#FA5252",
              position: "insideTopRight",
            }}
          />
        ) : null}
        <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={dailyBudget && d.cost > dailyBudget ? "#FF6B6B" : "#4C7B61"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
