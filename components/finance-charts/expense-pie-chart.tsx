"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { COLORS as APP_COLORS } from "@/lib/constants";

const CHART_COLORS = [
  "#184671",
  "#FFA041",
  "#E4432F",
  "#2D6FD1",
  "#F5C518",
  "#16a34a",
  "#C3ACA5",
  "#8b5cf6",
  "#ec4899",
  "#0ea5e9",
];

interface CategoryData {
  name: string;
  value: number;
}

interface ExpensePieChartProps {
  data: CategoryData[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm shadow-lg ring-1 ring-black/5"
      style={{
        backgroundColor: APP_COLORS.shared.surface,
        color: APP_COLORS.shared.text,
      }}
    >
      <p className="font-medium">{item.name}</p>
      <p className="text-muted-foreground">
        EUR {item.value.toLocaleString("en", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p
          className="text-sm"
          style={{ color: APP_COLORS.shared.textMuted }}
        >
          No expense data to display
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="75%"
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {data.map((_entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-xs" style={{ color: APP_COLORS.shared.text }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
