"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { format, subMonths } from "date-fns";
import { useUser } from "@/components/user-provider";
import { useFinance } from "@/hooks/use-finance";
import { FinanceEntryDialog } from "@/components/finance-entry-dialog";
import { COLORS, PEOPLE, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import { FinanceEntry, Person } from "@/lib/types";
import { Button } from "@/components/ui/button";

// Dynamically import chart components to avoid SSR issues with Recharts
const ExpensePieChart = dynamic(
  () =>
    import("@/components/finance-charts/expense-pie-chart").then(
      (mod) => mod.ExpensePieChart
    ),
  { ssr: false }
);

const MonthlyBarChart = dynamic(
  () =>
    import("@/components/finance-charts/monthly-bar-chart").then(
      (mod) => mod.MonthlyBarChart
    ),
  { ssr: false }
);

// ─── Helpers ───────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatCurrency(amount: number) {
  return amount.toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Component ─────────────────────────────────────────────

export default function FinancesPage() {
  const { currentUser, colors } = useUser();
  const { entries, loading, fetchEntries, addEntry, updateEntry, deleteEntry } =
    useFinance(currentUser);

  // All entries (unfiltered) for charts — fetched separately
  const [allEntries, setAllEntries] = useState<FinanceEntry[]>([]);

  // Filters
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterPerson, setFilterPerson] = useState<Person | "All">("All");
  const [filterType, setFilterType] = useState<"income" | "expense" | "All">(
    "All"
  );

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);

  // Fetch filtered entries for the list
  const refreshList = useCallback(() => {
    fetchEntries({
      month: filterMonth,
      year: filterYear,
      person: filterPerson,
      type: filterType,
    });
  }, [fetchEntries, filterMonth, filterYear, filterPerson, filterType]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  // Fetch all entries for the current year for charts
  useEffect(() => {
    // We need a broader dataset for the bar chart and projections
    // Fetch current year unfiltered
    const fetchAll = async () => {
      const { supabase } = await import("@/lib/supabase");
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (
          !url ||
          !key ||
          url === "your-supabase-url" ||
          key === "your-supabase-anon-key" ||
          url.includes("placeholder") ||
          url === ""
        ) {
          setAllEntries([]);
          return;
        }

        const startDate = `${filterYear}-01-01`;
        const endDate = `${filterYear}-12-31`;
        const { data, error } = await supabase
          .from("finance_entries")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false });

        if (error) {
          setAllEntries([]);
          return;
        }
        setAllEntries((data as FinanceEntry[]) ?? []);
      } catch {
        setAllEntries([]);
      }
    };
    fetchAll();
  }, [filterYear, entries]); // re-fetch when entries change (after add/edit/delete)

  // Navigate months
  const goToPrevMonth = () => {
    if (filterMonth === 0) {
      setFilterMonth(11);
      setFilterYear((y) => y - 1);
    } else {
      setFilterMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (filterMonth === 11) {
      setFilterMonth(0);
      setFilterYear((y) => y + 1);
    } else {
      setFilterMonth((m) => m + 1);
    }
  };

  // ─── Derived Data ──────────────────────────────────────────

  // Summary for the currently displayed filtered entries
  const summary = useMemo(() => {
    const income = entries
      .filter((e) => e.type === "income")
      .reduce((s, e) => s + e.amount, 0);
    const expense = entries
      .filter((e) => e.type === "expense")
      .reduce((s, e) => s + e.amount, 0);
    return { income, expense, net: income - expense };
  }, [entries]);

  // Pie chart data — expenses of the selected month grouped by category
  const pieData = useMemo(() => {
    const monthExpenses = entries.filter((e) => e.type === "expense");
    const grouped: Record<string, number> = {};
    for (const e of monthExpenses) {
      grouped[e.category] = (grouped[e.category] ?? 0) + e.amount;
    }
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  // Bar chart data — monthly income vs expenses for the year
  const barData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    // Pre-fill the last 6 months from the selected month
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(filterYear, filterMonth, 1), i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { income: 0, expense: 0 };
    }

    for (const e of allEntries) {
      const key = e.date.substring(0, 7); // "YYYY-MM"
      if (months[key]) {
        if (e.type === "income") months[key].income += e.amount;
        else months[key].expense += e.amount;
      }
    }

    return Object.entries(months).map(([key, val]) => {
      const [, m] = key.split("-");
      return {
        month: SHORT_MONTHS[parseInt(m, 10) - 1],
        income: Math.round(val.income * 100) / 100,
        expense: Math.round(val.expense * 100) / 100,
      };
    });
  }, [allEntries, filterYear, filterMonth]);

  // Projections — recurring entries + 3-month average of non-recurring
  const projections = useMemo(() => {
    const recurring = allEntries.filter((e) => e.is_recurring);
    const recurringIncome = recurring
      .filter((e) => e.type === "income")
      .reduce((s, e) => s + e.amount, 0);
    const recurringExpense = recurring
      .filter((e) => e.type === "expense")
      .reduce((s, e) => s + e.amount, 0);

    // Get last 3 months of non-recurring entries
    const last3 = [0, 1, 2].map((i) => {
      const d = subMonths(new Date(filterYear, filterMonth, 1), i + 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthEntries = allEntries.filter(
        (e) => e.date.startsWith(ym) && !e.is_recurring
      );
      return {
        income: monthEntries
          .filter((e) => e.type === "income")
          .reduce((s, e) => s + e.amount, 0),
        expense: monthEntries
          .filter((e) => e.type === "expense")
          .reduce((s, e) => s + e.amount, 0),
      };
    });

    const monthCount = last3.filter(
      (m) => m.income > 0 || m.expense > 0
    ).length || 1;

    const avgNonRecIncome =
      last3.reduce((s, m) => s + m.income, 0) / monthCount;
    const avgNonRecExpense =
      last3.reduce((s, m) => s + m.expense, 0) / monthCount;

    // Deduplicate recurring (use unique category+amount combos)
    const uniqueRecurring = new Map<string, number>();
    for (const e of recurring) {
      const key = `${e.type}|${e.category}|${e.amount}`;
      uniqueRecurring.set(key, e.amount);
    }
    let dedupRecIncome = 0;
    let dedupRecExpense = 0;
    for (const [key, amt] of uniqueRecurring) {
      if (key.startsWith("income|")) dedupRecIncome += amt;
      else dedupRecExpense += amt;
    }

    const estIncome = dedupRecIncome + avgNonRecIncome;
    const estExpense = dedupRecExpense + avgNonRecExpense;

    return {
      income: estIncome,
      expense: estExpense,
      net: estIncome - estExpense,
    };
  }, [allEntries, filterYear, filterMonth]);

  // ─── Handlers ──────────────────────────────────────────────

  const handleSave = async (data: {
    type: "income" | "expense";
    amount: number;
    category: string;
    description?: string | null;
    date: string;
    is_recurring: boolean;
  }) => {
    if (editingEntry) {
      await updateEntry(editingEntry.id, data);
    } else {
      await addEntry(data);
    }
    setEditingEntry(null);
    refreshList();
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    setEditingEntry(null);
    refreshList();
  };

  const openAdd = () => {
    setEditingEntry(null);
    setDialogOpen(true);
  };

  const openEdit = (entry: FinanceEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  // ─── Render ────────────────────────────────────────────────

  return (
    <div
      className="min-h-[calc(100vh-3.5rem)]"
      style={{ backgroundColor: COLORS.shared.background }}
    >
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Wallet className="size-5" style={{ color: colors.secondary }} />
              <span
                className="text-sm font-medium"
                style={{ color: colors.secondary }}
              >
                Finances
              </span>
            </div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: colors.primary }}
            >
              Money Overview
            </h1>
          </div>
          <Button
            onClick={openAdd}
            className="gap-1.5 rounded-xl shadow-sm"
            style={{ backgroundColor: colors.primary }}
          >
            <Plus className="size-4" />
            Add Entry
          </Button>
        </div>

        {/* Month Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <ChevronLeft
              className="size-5"
              style={{ color: COLORS.shared.textMuted }}
            />
          </button>
          <h2
            className="text-lg font-semibold"
            style={{ color: COLORS.shared.text }}
          >
            {MONTHS[filterMonth]} {filterYear}
          </h2>
          <button
            onClick={goToNextMonth}
            className="rounded-lg p-2 transition-colors hover:bg-black/5"
          >
            <ChevronRight
              className="size-5"
              style={{ color: COLORS.shared.textMuted }}
            />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Income */}
          <div
            className="rounded-2xl p-4 transition-all"
            style={{
              background: `linear-gradient(135deg, #f0fdf4, #dcfce7)`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-green-600/10">
                <TrendingUp className="size-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-800/70">
                Income
              </span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              EUR {formatCurrency(summary.income)}
            </p>
          </div>

          {/* Expenses */}
          <div
            className="rounded-2xl p-4 transition-all"
            style={{
              background: `linear-gradient(135deg, #fef2f2, #fee2e2)`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-red-600/10">
                <TrendingDown className="size-4 text-red-600" />
              </div>
              <span className="text-sm font-medium text-red-800/70">
                Expenses
              </span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              EUR {formatCurrency(summary.expense)}
            </p>
          </div>

          {/* Net Balance */}
          <div
            className="rounded-2xl p-4 transition-all"
            style={{
              background:
                summary.net >= 0
                  ? `linear-gradient(135deg, ${colors.lightPrimary}, ${colors.lightSecondary})`
                  : `linear-gradient(135deg, #fef2f2, #fff7ed)`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="flex size-8 items-center justify-center rounded-lg"
                style={{
                  backgroundColor:
                    summary.net >= 0 ? `${colors.primary}15` : "#ef444415",
                }}
              >
                <Wallet
                  className="size-4"
                  style={{
                    color: summary.net >= 0 ? colors.primary : "#ef4444",
                  }}
                />
              </div>
              <span
                className="text-sm font-medium"
                style={{
                  color: summary.net >= 0 ? `${colors.primary}B0` : "#991b1bB0",
                }}
              >
                Net Balance
              </span>
            </div>
            <p
              className="text-2xl font-bold"
              style={{
                color: summary.net >= 0 ? colors.primary : "#ef4444",
              }}
            >
              {summary.net < 0 ? "-" : ""}EUR{" "}
              {formatCurrency(Math.abs(summary.net))}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Expense Breakdown Pie Chart */}
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: COLORS.shared.surface,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <h3
              className="mb-3 flex items-center gap-2 text-base font-semibold"
              style={{ color: COLORS.shared.text }}
            >
              <BarChart3
                className="size-4"
                style={{ color: colors.secondary }}
              />
              Expense Breakdown
            </h3>
            <div className="h-64">
              <ExpensePieChart data={pieData} />
            </div>
          </div>

          {/* Monthly Income vs Expenses Bar Chart */}
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: COLORS.shared.surface,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <h3
              className="mb-3 flex items-center gap-2 text-base font-semibold"
              style={{ color: COLORS.shared.text }}
            >
              <BarChart3
                className="size-4"
                style={{ color: colors.primary }}
              />
              Last 6 Months
            </h3>
            <div className="h-64">
              <MonthlyBarChart
                data={barData}
                incomeColor="#16a34a"
                expenseColor={colors.accent}
              />
            </div>
          </div>
        </div>

        {/* Projections Card */}
        <div
          className="mb-6 rounded-2xl p-4"
          style={{
            background: `linear-gradient(135deg, ${colors.lightSecondary}, ${colors.lightPrimary})`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
          }}
        >
          <h3
            className="mb-3 flex items-center gap-2 text-base font-semibold"
            style={{ color: COLORS.shared.text }}
          >
            <Sparkles className="size-4" style={{ color: colors.secondary }} />
            Next Month Projection
          </h3>
          <p
            className="mb-3 text-xs"
            style={{ color: COLORS.shared.textMuted }}
          >
            Based on recurring entries + 3-month average of one-time items
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: COLORS.shared.textMuted }}
              >
                Est. Income
              </p>
              <p className="text-lg font-bold text-green-600">
                EUR {formatCurrency(projections.income)}
              </p>
            </div>
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: COLORS.shared.textMuted }}
              >
                Est. Expenses
              </p>
              <p className="text-lg font-bold text-red-500">
                EUR {formatCurrency(projections.expense)}
              </p>
            </div>
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: COLORS.shared.textMuted }}
              >
                Est. Net
              </p>
              <p
                className="text-lg font-bold"
                style={{
                  color: projections.net >= 0 ? "#16a34a" : "#ef4444",
                }}
              >
                {projections.net < 0 ? "-" : ""}EUR{" "}
                {formatCurrency(Math.abs(projections.net))}
              </p>
            </div>
          </div>
        </div>

        {/* Entries Section */}
        <div
          className="rounded-2xl"
          style={{
            backgroundColor: COLORS.shared.surface,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
          }}
        >
          {/* Filter Bar */}
          <div
            className="flex flex-wrap items-center gap-2 border-b px-4 py-3"
            style={{ borderColor: COLORS.shared.border }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: COLORS.shared.text }}
            >
              Filter:
            </span>

            {/* Person filter */}
            <div className="flex rounded-lg" style={{ backgroundColor: COLORS.shared.background }}>
              {(["All", ...PEOPLE] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPerson(p as Person | "All")}
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
                  style={{
                    backgroundColor:
                      filterPerson === p ? colors.primary : "transparent",
                    color:
                      filterPerson === p ? "#fff" : COLORS.shared.textMuted,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex rounded-lg" style={{ backgroundColor: COLORS.shared.background }}>
              {(["All", "income", "expense"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t as "income" | "expense" | "All")}
                  className="px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all"
                  style={{
                    backgroundColor:
                      filterType === t ? colors.secondary : "transparent",
                    color:
                      filterType === t ? "#fff" : COLORS.shared.textMuted,
                  }}
                >
                  {t === "All" ? "All Types" : t}
                </button>
              ))}
            </div>
          </div>

          {/* Entries List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div
                className="size-6 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: `${colors.primary}40`, borderTopColor: "transparent" }}
              />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div
                className="mb-3 flex size-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.lightPrimary }}
              >
                <Wallet className="size-6" style={{ color: colors.primary }} />
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: COLORS.shared.text }}
              >
                No entries yet
              </p>
              <p
                className="mt-1 text-xs text-center"
                style={{ color: COLORS.shared.textMuted }}
              >
                Add your first income or expense to start tracking your finances.
              </p>
              <Button
                onClick={openAdd}
                className="mt-4 gap-1.5 rounded-xl"
                size="sm"
                style={{ backgroundColor: colors.primary }}
              >
                <Plus className="size-3.5" />
                Add Entry
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop table header */}
              <div
                className="hidden md:grid md:grid-cols-[100px_80px_1fr_1fr_120px_40px] gap-3 border-b px-4 py-2 text-xs font-medium"
                style={{
                  color: COLORS.shared.textMuted,
                  borderColor: COLORS.shared.border,
                }}
              >
                <span>Date</span>
                <span>Person</span>
                <span>Category</span>
                <span>Description</span>
                <span className="text-right">Amount</span>
                <span />
              </div>

              {entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onClick={() => openEdit(entry)}
                  userColors={colors}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Floating Add Button (mobile) */}
      <button
        onClick={openAdd}
        className="fixed bottom-24 right-5 z-30 flex size-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 md:hidden"
        style={{
          backgroundColor: colors.primary,
          boxShadow: `0 4px 20px ${colors.primary}40`,
        }}
      >
        <Plus className="size-6 text-white" />
      </button>

      {/* Dialog */}
      <FinanceEntryDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingEntry(null);
        }}
        entry={editingEntry}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

// ─── Entry Row ──────────────────────────────────────────────

function EntryRow({
  entry,
  onClick,
  userColors,
}: {
  entry: FinanceEntry;
  onClick: () => void;
  userColors: (typeof COLORS)["Luca"] | (typeof COLORS)["Vale"];
}) {
  const personColors = COLORS[entry.person];
  const isIncome = entry.type === "income";
  const dateStr = format(new Date(entry.date + "T00:00:00"), "MMM d");

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-colors hover:bg-black/[0.02] active:bg-black/[0.04]"
    >
      {/* Desktop row */}
      <div
        className="hidden md:grid md:grid-cols-[100px_80px_1fr_1fr_120px_40px] gap-3 items-center border-b px-4 py-3"
        style={{ borderColor: COLORS.shared.border }}
      >
        <span
          className="text-sm"
          style={{ color: COLORS.shared.textMuted }}
        >
          {dateStr}
        </span>
        <span
          className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${personColors.primary}15`,
            color: personColors.primary,
          }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: personColors.primary }}
          />
          {entry.person}
        </span>
        <span
          className="text-sm font-medium truncate"
          style={{ color: COLORS.shared.text }}
        >
          {entry.category}
        </span>
        <span
          className="text-sm truncate"
          style={{ color: COLORS.shared.textMuted }}
        >
          {entry.description || "--"}
        </span>
        <span
          className="text-right text-sm font-semibold tabular-nums"
          style={{ color: isIncome ? "#16a34a" : "#ef4444" }}
        >
          {isIncome ? "+" : "-"}EUR {formatCurrency(entry.amount)}
        </span>
        <span className="flex justify-center">
          {entry.is_recurring && (
            <RefreshCw
              className="size-3.5"
              style={{ color: COLORS.shared.textMuted }}
            />
          )}
        </span>
      </div>

      {/* Mobile card */}
      <div
        className="md:hidden flex items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: COLORS.shared.border }}
      >
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
          style={{
            backgroundColor: isIncome ? "#f0fdf4" : "#fef2f2",
            color: isIncome ? "#16a34a" : "#ef4444",
          }}
        >
          {isIncome ? (
            <TrendingUp className="size-4" />
          ) : (
            <TrendingDown className="size-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium truncate"
              style={{ color: COLORS.shared.text }}
            >
              {entry.category}
            </span>
            {entry.is_recurring && (
              <RefreshCw
                className="size-3 shrink-0"
                style={{ color: COLORS.shared.textMuted }}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs"
              style={{ color: COLORS.shared.textMuted }}
            >
              {dateStr}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${personColors.primary}15`,
                color: personColors.primary,
              }}
            >
              {entry.person}
            </span>
          </div>
        </div>
        <span
          className="shrink-0 text-sm font-semibold tabular-nums"
          style={{ color: isIncome ? "#16a34a" : "#ef4444" }}
        >
          {isIncome ? "+" : "-"}{formatCurrency(entry.amount)}
        </span>
      </div>
    </button>
  );
}
