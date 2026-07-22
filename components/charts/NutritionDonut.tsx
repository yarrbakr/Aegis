"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// Weekly macro split (protein / carbs / fat, in grams) as a donut. Colors follow
// Design.md: protein = sage, carbs = coral, plus an amber for fat.
const COLORS = {
  protein: "#4C7B61",
  carbs: "#FF6B6B",
  fat: "#F4A259",
};

export function NutritionDonut({
  protein,
  carbs,
  fat,
}: {
  protein: number;
  carbs: number;
  fat: number;
}) {
  const total = protein + carbs + fat;
  const data = [
    { name: "Protein", value: protein, color: COLORS.protein },
    { name: "Carbs", value: carbs, color: COLORS.carbs },
    { name: "Fat", value: fat, color: COLORS.fat },
  ];

  if (total === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-xs text-[#6B7280]">
        No nutrition data
      </div>
    );
  }

  return (
    <div>
      <div className="relative mx-auto" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={82}
              paddingAngle={2}
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const v = Number(value);
                const pct = total ? Math.round((v / total) * 100) : 0;
                return [`${v} g (${pct}%)`, name];
              }}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-semibold text-[#1F2933]">
            {total}
            <span className="text-xs text-[#6B7280]"> g</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.06em] text-[#6B7280]">
            macros
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
        {data.map((d) => (
          <span key={d.name} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: d.color }}
              aria-hidden
            />
            <span className="text-[#6B7280]">{d.name}</span>
            <span className="font-mono text-[#1F2933]">{d.value}g</span>
          </span>
        ))}
      </div>
    </div>
  );
}
