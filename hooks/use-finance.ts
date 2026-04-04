"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { FinanceEntry, Person } from "@/lib/types";

interface AddEntryData {
  type: "income" | "expense";
  amount: number;
  category: string;
  description?: string | null;
  date: string;
  is_recurring: boolean;
}

interface UpdateEntryData {
  type?: "income" | "expense";
  amount?: number;
  category?: string;
  description?: string | null;
  date?: string;
  is_recurring?: boolean;
}

interface FetchFilters {
  month?: number; // 0-indexed
  year?: number;
  person?: Person | "All";
  type?: "income" | "expense" | "All";
  category?: string;
}

export function useFinance(currentUser: Person) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
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

  const fetchEntries = useCallback(
    async (filters?: FetchFilters) => {
      if (!isSupabaseConfigured()) {
        setEntries([]);
        return;
      }

      setLoading(true);
      try {
        let query = supabase
          .from("finance_entries")
          .select("*")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false });

        if (filters?.month !== undefined && filters?.year !== undefined) {
          const startDate = `${filters.year}-${String(filters.month + 1).padStart(2, "0")}-01`;
          const lastDay = new Date(filters.year, filters.month + 1, 0).getDate();
          const endDate = `${filters.year}-${String(filters.month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
          query = query.gte("date", startDate).lte("date", endDate);
        }

        if (filters?.person && filters.person !== "All") {
          query = query.eq("person", filters.person);
        }

        if (filters?.type && filters.type !== "All") {
          query = query.eq("type", filters.type);
        }

        if (filters?.category) {
          query = query.eq("category", filters.category);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Failed to fetch finance entries:", error);
          setEntries([]);
          return;
        }

        setEntries((data as FinanceEntry[]) ?? []);
      } catch (err) {
        console.error("Failed to fetch finance entries:", err);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addEntry = useCallback(
    async (data: AddEntryData) => {
      if (!isSupabaseConfigured()) return;

      try {
        const { error } = await supabase.from("finance_entries").insert({
          person: currentUser,
          type: data.type,
          amount: data.amount,
          category: data.category,
          description: data.description || null,
          date: data.date,
          is_recurring: data.is_recurring,
        });

        if (error) {
          console.error("Failed to add finance entry:", error);
          return;
        }
      } catch (err) {
        console.error("Failed to add finance entry:", err);
      }
    },
    [currentUser]
  );

  const updateEntry = useCallback(
    async (id: string, data: UpdateEntryData) => {
      if (!isSupabaseConfigured()) return;

      try {
        const { error } = await supabase
          .from("finance_entries")
          .update(data)
          .eq("id", id);

        if (error) {
          console.error("Failed to update finance entry:", error);
          return;
        }
      } catch (err) {
        console.error("Failed to update finance entry:", err);
      }
    },
    []
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!isSupabaseConfigured()) return;

      try {
        const { error } = await supabase
          .from("finance_entries")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Failed to delete finance entry:", error);
          return;
        }
      } catch (err) {
        console.error("Failed to delete finance entry:", err);
      }
    },
    []
  );

  return {
    entries,
    loading,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}
