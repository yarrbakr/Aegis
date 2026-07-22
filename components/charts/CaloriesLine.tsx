"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// "Calories Graph" from the reference (Design.md D11): per-day calories across
// the current week as a line. The Weekly/Monthly/Yearly toggle is real UI, but
// we only have one week of history, so Monthly/Yearly show an honest empty state
// rather than invented data ("evidence over hype", CLAUDE.md).

type Point = { label: string; calories: number };
type Period = "weekly" | "monthly" | "yearly";

export function CaloriesLine({ data }: { data: Point[] }) {
  const [period, setPeriod] = useState<Period>("weekly");
  const hasData = data.some((d) => d.calories > 0);

  const Tab = ({ id, children }: { id: Period; children: string }) => {
    const active = period === id;
    const enabled = id === "weekly"; // only weekly has real data for now
    return (
      <button
        type="button"
        onClick={() => enabled && setPeriod(id)}
        disabled={!enabled}
        title={enabled ? undefined : "Available once you have more history"}
        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
          active
            ? "bg-[#4C7B61] text-white"
            : enabled
              ? "text-[#6B7280] hover:bg-[#F3F4F6]"
              : "cursor-not-allowed text-[#C4C7CE]"
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-[#1F2933]">
          Calories Graph
        </h3>
        <div className="flex items-center gap-1 rounded-full bg-[#F8F9FA] p-0.5">
          <Tab id="weekly">Weekly</Tab>
          <Tab id="monthly">Monthly</Tab>
          <Tab id="yearly">Yearly</Tab>
        </div>
      </div>

      {period !== "weekly" ? (
        <div className="flex h-[220px] items-center justify-center text-center text-xs text-[#9CA3AF]">
          Not enough history yet — check back after a few weeks of plans.
        </div>
      ) : !hasData ? (
        <div className="flex h-[220px] items-center justify-center text-center text-xs text-[#9CA3AF]">
          Generate a plan to see your weekly calories here.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              width={40}
            />
            <Tooltip
              formatter={(value) => [`${Number(value)} kcal`, "Calories"]}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="calories"
              stroke="#4C7B61"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#4C7B61", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
