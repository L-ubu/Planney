"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  TicketCheck,
  CheckCircle2,
  Circle,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@/components/user-provider";
import { useTickets } from "@/hooks/use-tickets";
import { TicketDialog } from "@/components/ticket-dialog";
import { COLORS, TICKET_CATEGORIES } from "@/lib/constants";
import { Ticket, Person } from "@/lib/types";
import { Button } from "@/components/ui/button";

// ---- Helpers ---------------------------------------------------------------

const PRIORITY_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  done: "Done",
};

const PRIORITY_SORT_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// ---- Component -------------------------------------------------------------

export default function TicketsPage() {
  const { currentUser, colors } = useUser();
  const { tickets, loading, fetchTickets, addTicket, updateTicket, deleteTicket } =
    useTickets(currentUser);

  // View: "mine" or "all"
  const [view, setView] = useState<"mine" | "all">("mine");

  // Filters
  const [filterStatus, setFilterStatus] = useState<
    "all" | "open" | "in_progress" | "done"
  >("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Sort
  const [sortBy, setSortBy] = useState<"newest" | "priority">("newest");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  // Fetch tickets
  const refresh = useCallback(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Filter + sort
  const displayedTickets = useMemo(() => {
    let filtered = [...tickets];

    // View filter
    if (view === "mine") {
      filtered = filtered.filter((t) => t.assigned_to === currentUser);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((t) => t.category === filterCategory);
    }

    // Sort
    if (sortBy === "priority") {
      filtered.sort(
        (a, b) =>
          PRIORITY_SORT_ORDER[a.priority] - PRIORITY_SORT_ORDER[b.priority]
      );
    }
    // "newest" is the default order from Supabase (created_at desc)

    return filtered;
  }, [tickets, view, filterStatus, filterCategory, sortBy, currentUser]);

  // Handlers
  const handleSave = async (data: {
    title: string;
    description?: string | null;
    assigned_to: Person;
    category: string;
    priority: "low" | "medium" | "high";
    status?: "open" | "in_progress" | "done";
  }) => {
    if (editingTicket) {
      await updateTicket(editingTicket.id, data);
    } else {
      await addTicket(data);
    }
    setEditingTicket(null);
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteTicket(id);
    setEditingTicket(null);
    refresh();
  };

  const handleToggleDone = async (ticket: Ticket) => {
    const newStatus = ticket.status === "done" ? "open" : "done";
    await updateTicket(ticket.id, { status: newStatus });
    refresh();
  };

  const openAdd = () => {
    setEditingTicket(null);
    setDialogOpen(true);
  };

  const openEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setDialogOpen(true);
  };

  // ---- Render --------------------------------------------------------------

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
              <TicketCheck
                className="size-5"
                style={{ color: colors.secondary }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: colors.secondary }}
              >
                Tickets
              </span>
            </div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: colors.primary }}
            >
              Task Board
            </h1>
          </div>
          <Button
            onClick={openAdd}
            className="gap-1.5 rounded-xl shadow-sm"
            style={{ backgroundColor: colors.primary }}
          >
            <Plus className="size-4" />
            New Ticket
          </Button>
        </div>

        {/* View Toggle (My Tickets / All Tickets) */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex rounded-lg p-1"
            style={{ backgroundColor: COLORS.shared.surface, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <button
              onClick={() => setView("mine")}
              className="rounded-md px-4 py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor:
                  view === "mine" ? colors.primary : "transparent",
                color: view === "mine" ? "#fff" : COLORS.shared.textMuted,
              }}
            >
              My Tickets
            </button>
            <button
              onClick={() => setView("all")}
              className="rounded-md px-4 py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor:
                  view === "all" ? colors.primary : "transparent",
                color: view === "all" ? "#fff" : COLORS.shared.textMuted,
              }}
            >
              All Tickets
            </button>
          </div>

          {/* Sort toggle */}
          <button
            onClick={() =>
              setSortBy((s) => (s === "newest" ? "priority" : "newest"))
            }
            className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-black/5"
            style={{ color: COLORS.shared.textMuted }}
          >
            <ArrowUpDown className="size-3.5" />
            {sortBy === "newest" ? "Newest first" : "Priority"}
          </button>
        </div>

        {/* Filter Bar */}
        <div
          className="mb-6 rounded-2xl"
          style={{
            backgroundColor: COLORS.shared.surface,
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
          }}
        >
          <div
            className="flex flex-wrap items-center gap-2 px-4 py-3"
            style={{ borderColor: COLORS.shared.border }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: COLORS.shared.text }}
            >
              Filter:
            </span>

            {/* Status filter */}
            <div
              className="flex rounded-lg"
              style={{ backgroundColor: COLORS.shared.background }}
            >
              {(
                [
                  { value: "all", label: "All" },
                  { value: "open", label: "Open" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "done", label: "Done" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
                  style={{
                    backgroundColor:
                      filterStatus === opt.value
                        ? colors.primary
                        : "transparent",
                    color:
                      filterStatus === opt.value
                        ? "#fff"
                        : COLORS.shared.textMuted,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div
              className="flex overflow-x-auto rounded-lg"
              style={{ backgroundColor: COLORS.shared.background }}
            >
              <button
                onClick={() => setFilterCategory("all")}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap"
                style={{
                  backgroundColor:
                    filterCategory === "all"
                      ? colors.secondary
                      : "transparent",
                  color:
                    filterCategory === "all"
                      ? "#fff"
                      : COLORS.shared.textMuted,
                }}
              >
                All Categories
              </button>
              {TICKET_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap"
                  style={{
                    backgroundColor:
                      filterCategory === cat
                        ? colors.secondary
                        : "transparent",
                    color:
                      filterCategory === cat
                        ? "#fff"
                        : COLORS.shared.textMuted,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="size-6 animate-spin rounded-full border-2 border-t-transparent"
              style={{
                borderColor: `${colors.primary}40`,
                borderTopColor: "transparent",
              }}
            />
          </div>
        ) : displayedTickets.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl py-16 px-4"
            style={{
              backgroundColor: COLORS.shared.surface,
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div
              className="mb-3 flex size-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.lightPrimary }}
            >
              <TicketCheck
                className="size-6"
                style={{ color: colors.primary }}
              />
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: COLORS.shared.text }}
            >
              No tickets yet
            </p>
            <p
              className="mt-1 text-xs text-center"
              style={{ color: COLORS.shared.textMuted }}
            >
              Create one to start tracking tasks!
            </p>
            <Button
              onClick={openAdd}
              className="mt-4 gap-1.5 rounded-xl"
              size="sm"
              style={{ backgroundColor: colors.primary }}
            >
              <Plus className="size-3.5" />
              New Ticket
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayedTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => openEdit(ticket)}
                onToggleDone={() => handleToggleDone(ticket)}
                userColors={colors}
              />
            ))}
          </div>
        )}
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
      <TicketDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTicket(null);
        }}
        ticket={editingTicket}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

// ---- Ticket Card -----------------------------------------------------------

function TicketCard({
  ticket,
  onClick,
  onToggleDone,
  userColors,
}: {
  ticket: Ticket;
  onClick: () => void;
  onToggleDone: () => void;
  userColors: (typeof COLORS)["Luca"] | (typeof COLORS)["Vale"];
}) {
  const assignedColors = COLORS[ticket.assigned_to];
  const createdColors = COLORS[ticket.created_by];
  const isDone = ticket.status === "done";
  const priorityColor = PRIORITY_COLORS[ticket.priority];

  const StatusIcon =
    ticket.status === "done"
      ? CheckCircle2
      : ticket.status === "in_progress"
        ? Clock
        : Circle;

  const statusColor =
    ticket.status === "done"
      ? "#22c55e"
      : ticket.status === "in_progress"
        ? "#f59e0b"
        : COLORS.shared.textMuted;

  let createdLabel = "";
  try {
    createdLabel = format(new Date(ticket.created_at), "MMM d");
  } catch {
    createdLabel = "";
  }

  return (
    <div
      className="group relative rounded-2xl transition-all hover:shadow-md"
      style={{
        backgroundColor: COLORS.shared.surface,
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        opacity: isDone ? 0.7 : 1,
      }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox / Done toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone();
          }}
          className="mt-0.5 shrink-0 rounded-full p-0.5 transition-colors hover:bg-black/5"
          aria-label={isDone ? "Mark as open" : "Mark as done"}
        >
          {isDone ? (
            <CheckCircle2
              className="size-5"
              style={{ color: "#22c55e" }}
              strokeWidth={2.5}
            />
          ) : (
            <Circle
              className="size-5"
              style={{ color: COLORS.shared.border }}
              strokeWidth={2}
            />
          )}
        </button>

        {/* Content (clickable) */}
        <button
          onClick={onClick}
          className="flex flex-1 flex-col gap-2 text-left min-w-0"
        >
          {/* Title row */}
          <div className="flex items-start gap-2">
            <span
              className="text-sm font-semibold leading-snug"
              style={{
                color: isDone ? COLORS.shared.textMuted : COLORS.shared.text,
                textDecoration: isDone ? "line-through" : "none",
              }}
            >
              {ticket.title}
            </span>
          </div>

          {/* Description preview */}
          {ticket.description && (
            <p
              className="text-xs leading-relaxed line-clamp-2"
              style={{ color: COLORS.shared.textMuted }}
            >
              {ticket.description}
            </p>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Assigned to badge */}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${assignedColors.primary}15`,
                color: assignedColors.primary,
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: assignedColors.primary }}
              />
              {ticket.assigned_to}
            </span>

            {/* Category badge */}
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${userColors.secondary}15`,
                color: userColors.secondary,
              }}
            >
              {ticket.category}
            </span>

            {/* Priority dot + label */}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${priorityColor}15`,
                color: priorityColor,
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: priorityColor }}
              />
              {PRIORITY_LABELS[ticket.priority]}
            </span>

            {/* Status badge */}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${statusColor}15`,
                color: statusColor,
              }}
            >
              <StatusIcon className="size-2.5" />
              {STATUS_LABELS[ticket.status]}
            </span>

            {/* Created by + date */}
            <span
              className="ml-auto inline-flex items-center gap-1 text-[10px]"
              style={{ color: COLORS.shared.textMuted }}
            >
              by{" "}
              <span
                className="font-medium"
                style={{ color: createdColors.primary }}
              >
                {ticket.created_by}
              </span>
              {createdLabel && <span> {createdLabel}</span>}
            </span>
          </div>
        </button>
      </div>

      {/* Left accent border based on priority */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ backgroundColor: priorityColor }}
      />
    </div>
  );
}
