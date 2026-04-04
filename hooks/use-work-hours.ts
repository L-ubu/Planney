"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { WorkHour, Person } from "@/lib/types";

interface AddWorkHourData {
  date: string;
  start_time: string;
  end_time: string;
  notes?: string | null;
}

interface UpdateWorkHourData {
  date?: string;
  start_time?: string;
  end_time?: string;
  notes?: string | null;
}

export function useWorkHours(currentUser: Person) {
  const [workHours, setWorkHours] = useState<WorkHour[]>([]);
  const [loading, setLoading] = useState(false);

  const isSupabaseConfigured = () => {
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
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const fetchWorkHours = useCallback(
    async (year: number, month: number) => {
      if (!isSupabaseConfigured()) {
        setWorkHours([]);
        return;
      }

      setLoading(true);
      try {
        // month is 0-indexed (JS Date convention), so we add 1 for the query
        const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        // Get the last day of the month
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

        const { data, error } = await supabase
          .from("work_hours")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true });

        if (error) {
          console.error("Failed to fetch work hours:", error);
          setWorkHours([]);
          return;
        }

        setWorkHours((data as WorkHour[]) ?? []);
      } catch (err) {
        console.error("Failed to fetch work hours:", err);
        setWorkHours([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addWorkHour = useCallback(
    async (data: AddWorkHourData, year: number, month: number) => {
      if (!isSupabaseConfigured()) return;

      try {
        const { error } = await supabase.from("work_hours").insert({
          person: currentUser,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          notes: data.notes || null,
        });

        if (error) {
          console.error("Failed to add work hour:", error);
          return;
        }

        await fetchWorkHours(year, month);
      } catch (err) {
        console.error("Failed to add work hour:", err);
      }
    },
    [currentUser, fetchWorkHours]
  );

  const updateWorkHour = useCallback(
    async (id: string, data: UpdateWorkHourData, year: number, month: number) => {
      if (!isSupabaseConfigured()) return;

      try {
        const { error } = await supabase
          .from("work_hours")
          .update(data)
          .eq("id", id);

        if (error) {
          console.error("Failed to update work hour:", error);
          return;
        }

        await fetchWorkHours(year, month);
      } catch (err) {
        console.error("Failed to update work hour:", err);
      }
    },
    [fetchWorkHours]
  );

  const deleteWorkHour = useCallback(
    async (id: string, year: number, month: number) => {
      if (!isSupabaseConfigured()) return;

      try {
        const { error } = await supabase
          .from("work_hours")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Failed to delete work hour:", error);
          return;
        }

        await fetchWorkHours(year, month);
      } catch (err) {
        console.error("Failed to delete work hour:", err);
      }
    },
    [fetchWorkHours]
  );

  return {
    workHours,
    loading,
    fetchWorkHours,
    addWorkHour,
    updateWorkHour,
    deleteWorkHour,
  };
}
