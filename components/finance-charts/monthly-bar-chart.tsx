"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { COLORS as APP_COLORS } from "@/lib/constants";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface MonthlyBarChartProps {
  data: MonthlyData[];
  incomeColor: string;
  expenseColor: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm shadow-lg ring-1 ring-black/5"
      style={{
        backgroundColor: APP_COLORS.shared.surface,
        color: APP_COLORS.shared.text,
      }}
    >
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((item, i) => (
        <p key={i} className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground capitalize">{item.name}:</span>{" "}
          EUR {item.value.toLocaleString("en", { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
}

export function MonthlyBarChart({
  data,
  incomeColor,
  expenseColor,
}: MonthlyBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p
          className="text-sm"
          style={{ color: APP_COLORS.shared.textMuted }}
        >
          No monthly data to display
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barGap={4} barCategoryGap="25%">
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={APP_COLORS.shared.border}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: APP_COLORS.shared.textMuted }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: APP_COLORS.shared.textMuted }}
          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          height={36}
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span
              className="text-xs capitalize"
              style={{ color: APP_COLORS.shared.text }}
            >
              {value}
            </span>
          )}
        />
        <Bar
          dataKey="income"
          fill={incomeColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="expense"
          fill={expenseColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
