"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  eachDayOfInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/user-provider";
import { useWorkHours } from "@/hooks/use-work-hours";
import { WorkHourDialog } from "@/components/work-hour-dialog";
import { COLORS } from "@/lib/constants";
import { WorkHour, Person } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function formatTimeShort(time: string): string {
  // "09:00" -> "9", "17:30" -> "17:30", "09:00:00" -> "9"
  const parts = time.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (m === 0) return String(h);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function WorkHourPill({
  workHour,
  onClick,
}: {
  workHour: WorkHour;
  onClick: (wh: WorkHour) => void;
}) {
  const personColors = COLORS[workHour.person as Person];
  const startShort = formatTimeShort(workHour.start_time);
  const endShort = formatTimeShort(workHour.end_time);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(workHour);
      }}
      className="w-full text-left rounded-lg px-1.5 py-0.5 text-[10px] sm:text-xs font-medium leading-tight truncate transition-all hover:opacity-80 active:scale-95 cursor-pointer"
      style={{
        backgroundColor: personColors.lightPrimary,
        color: personColors.primary,
      }}
      title={`${workHour.person}: ${workHour.start_time.slice(0, 5)} - ${workHour.end_time.slice(0, 5)}${workHour.notes ? ` (${workHour.notes})` : ""}`}
    >
      <span className="hidden sm:inline">
        {startShort}-{endShort}
      </span>
      <span className="sm:hidden">
        {startShort}-{endShort}
      </span>
    </button>
  );
}

function DayCell({
  day,
  currentMonth,
  workHoursForDay,
  onDayClick,
  onPillClick,
}: {
  day: Date;
  currentMonth: Date;
  workHoursForDay: WorkHour[];
  onDayClick: (day: Date) => void;
  onPillClick: (wh: WorkHour) => void;
}) {
  const inMonth = isSameMonth(day, currentMonth);
  const today = isToday(day);

  return (
    <button
      onClick={() => onDayClick(day)}
      className={`
        relative flex flex-col items-stretch p-1 sm:p-1.5 min-h-[60px] sm:min-h-[90px] rounded-xl border transition-all text-left
        cursor-pointer hover:shadow-sm active:scale-[0.98]
        ${today ? "ring-2 shadow-sm" : ""}
        ${!inMonth ? "opacity-40" : ""}
      `}
      style={
        {
          backgroundColor: today ? COLORS.shared.surface : "transparent",
          borderColor: today ? COLORS.shared.border : `${COLORS.shared.border}80`,
          "--tw-ring-color": today ? `${COLORS.shared.text}40` : undefined,
        } as React.CSSProperties
      }
    >
      {/* Day number */}
      <span
        className={`
          text-xs sm:text-sm font-medium leading-none mb-1
          ${today ? "flex size-6 sm:size-7 items-center justify-center rounded-full text-white" : "pl-0.5"}
        `}
        style={{
          backgroundColor: today ? COLORS.shared.text : undefined,
          color: today
            ? "#fff"
            : inMonth
              ? COLORS.shared.text
              : COLORS.shared.textMuted,
        }}
      >
        {format(day, "d")}
      </span>

      {/* Work hour pills */}
      <div className="flex flex-col gap-0.5 mt-auto">
        {workHoursForDay.slice(0, 3).map((wh) => (
          <WorkHourPill key={wh.id} workHour={wh} onClick={onPillClick} />
        ))}
        {workHoursForDay.length > 3 && (
          <span
            className="text-[9px] sm:text-[10px] font-medium pl-1"
            style={{ color: COLORS.shared.textMuted }}
          >
            +{workHoursForDay.length - 3} more
          </span>
        )}
      </div>
    </button>
  );
}

export default function CalendarPage() {
  const { currentUser, colors } = useUser();
  const {
    workHours,
    loading,
    fetchWorkHours,
    addWorkHour,
    updateWorkHour,
    deleteWorkHour,
  } = useWorkHours(currentUser);

  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingWorkHour, setEditingWorkHour] = useState<WorkHour | null>(null);

  // Fetch work hours whenever month changes
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    fetchWorkHours(year, month);
  }, [currentMonth, fetchWorkHours]);

  // Build the calendar grid days (always start on Monday)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Group work hours by date string for fast lookup
  const workHoursByDate = useMemo(() => {
    const map = new Map<string, WorkHour[]>();
    for (const wh of workHours) {
      const key = wh.date;
      const existing = map.get(key);
      if (existing) {
        existing.push(wh);
      } else {
        map.set(key, [wh]);
      }
    }
    return map;
  }, [workHours]);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((m) => subMonths(m, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => addMonths(m, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(startOfMonth(new Date()));
  }, []);

  const handleDayClick = useCallback((day: Date) => {
    setSelectedDate(day);
    setEditingWorkHour(null);
    setDialogOpen(true);
  }, []);

  const handlePillClick = useCallback((wh: WorkHour) => {
    setEditingWorkHour(wh);
    setSelectedDate(new Date(wh.date + "T00:00:00"));
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    (data: { date: string; start_time: string; end_time: string; notes: string | null }) => {
      addWorkHour(data, currentMonth.getFullYear(), currentMonth.getMonth());
    },
    [addWorkHour, currentMonth]
  );

  const handleUpdate = useCallback(
    (id: string, data: { start_time: string; end_time: string; notes: string | null }) => {
      updateWorkHour(id, data, currentMonth.getFullYear(), currentMonth.getMonth());
    },
    [updateWorkHour, currentMonth]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteWorkHour(id, currentMonth.getFullYear(), currentMonth.getMonth());
    },
    [deleteWorkHour, currentMonth]
  );

  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  return (
    <div
      className="min-h-[calc(100vh-3.5rem)] flex flex-col"
      style={{ backgroundColor: COLORS.shared.background }}
    >
      {/* Header */}
      <div className="mx-auto w-full max-w-4xl px-4 pt-6 pb-4 sm:px-6 sm:pt-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-10 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: colors.primary }}
            >
              <Calendar className="size-5" />
            </div>
            <div>
              <h1
                className="text-xl sm:text-2xl font-bold tracking-tight"
                style={{ color: colors.primary }}
              >
                Calendar
              </h1>
              <p
                className="text-xs sm:text-sm"
                style={{ color: COLORS.shared.textMuted }}
              >
                Work schedules for both of you
              </p>
            </div>
          </div>

          {/* Add button (mobile) */}
          <Button
            onClick={() => {
              setSelectedDate(new Date());
              setEditingWorkHour(null);
              setDialogOpen(true);
            }}
            className="sm:hidden rounded-xl text-white"
            size="icon"
            style={{ backgroundColor: colors.primary }}
          >
            <Plus className="size-5" />
          </Button>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={goToPrevMonth}
              className="rounded-xl"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h2
              className="text-lg sm:text-xl font-semibold min-w-[180px] text-center"
              style={{ color: COLORS.shared.text }}
            >
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={goToNextMonth}
              className="rounded-xl"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentMonth && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="rounded-xl text-xs"
              >
                Today
              </Button>
            )}

            {/* Add button (desktop) */}
            <Button
              onClick={() => {
                setSelectedDate(new Date());
                setEditingWorkHour(null);
                setDialogOpen(true);
              }}
              className="hidden sm:flex rounded-xl text-white gap-1.5"
              size="sm"
              style={{ backgroundColor: colors.primary }}
            >
              <Plus className="size-4" />
              Add Hours
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="mx-auto w-full max-w-4xl px-4 pb-8 sm:px-6 flex-1">
        <div
          className="rounded-2xl overflow-hidden border shadow-sm"
          style={{
            backgroundColor: COLORS.shared.surface,
            borderColor: COLORS.shared.border,
          }}
        >
          {/* Weekday headers */}
          <div
            className="grid grid-cols-7 border-b"
            style={{ borderColor: COLORS.shared.border }}
          >
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2.5 sm:py-3 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
                style={{ color: COLORS.shared.textMuted }}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div
                className="size-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${colors.primary}40`, borderTopColor: "transparent" }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayWorkHours = workHoursByDate.get(dateKey) ?? [];
                return (
                  <DayCell
                    key={dateKey}
                    day={day}
                    currentMonth={currentMonth}
                    workHoursForDay={dayWorkHours}
                    onDayClick={handleDayClick}
                    onPillClick={handlePillClick}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-4">
          <div className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: COLORS.Luca.primary }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: COLORS.shared.textMuted }}
            >
              Luca
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: COLORS.Vale.primary }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: COLORS.shared.textMuted }}
            >
              Vale
            </span>
          </div>
        </div>
      </div>

      {/* Work Hour Dialog */}
      <WorkHourDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDate}
        editingWorkHour={editingWorkHour}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
