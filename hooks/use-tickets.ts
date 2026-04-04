"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Ticket, Person } from "@/lib/types";

interface AddTicketData {
  title: string;
  description?: string | null;
  assigned_to: Person;
  category: string;
  priority: "low" | "medium" | "high";
}

interface UpdateTicketData {
  title?: string;
  description?: string | null;
  assigned_to?: Person;
  category?: string;
  priority?: "low" | "medium" | "high";
  status?: "open" | "in_progress" | "done";
}

interface FetchFilters {
  assigned_to?: Person;
  status?: "open" | "in_progress" | "done";
  category?: string;
}

export function useTickets(currentUser: Person) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
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

  const fetchTickets = useCallback(
    async (filters?: FetchFilters) => {
      if (!isSupabaseConfigured()) {
        setTickets([]);
        return;
      }

      setLoading(true);
      try {
        let query = supabase
          .from("tickets")
          .select("*")
          .order("created_at", { ascending: false });

        if (filters?.assigned_to) {
          query = query.eq("assigned_to", filters.assigned_to);
        }

        if (filters?.status) {
          query = query.eq("status", filters.status);
        }

        if (filters?.category) {
          query = query.eq("category", filters.category);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Failed to fetch tickets:", error);
          setTickets([]);
          return;
        }

        setTickets((data as Ticket[]) ?? []);
      } catch (err) {
        console.error("Failed to fetch tickets:", err);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addTicket = useCallback(
    async (data: AddTicketData) => {
      if (!isSupabaseConfigured()) return;

      try {
        const { error } = await supabase.from("tickets").insert({
          created_by: currentUser,
          assigned_to: data.assigned_to,
          title: data.title,
          description: data.description || null,
          category: data.category,
          priority: data.priority,
          status: "open",
        });

        if (error) {
          console.error("Failed to add ticket:", error);
          return;
        }
      } catch (err) {
        console.error("Failed to add ticket:", err);
      }
    },
    [currentUser]
  );

  const updateTicket = useCallback(
    async (id: string, data: UpdateTicketData) => {
      if (!isSupabaseConfigured()) return;

      try {
        const { error } = await supabase
          .from("tickets")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (error) {
          console.error("Failed to update ticket:", error);
          return;
        }
      } catch (err) {
        console.error("Failed to update ticket:", err);
      }
    },
    []
  );

  const deleteTicket = useCallback(
    async (id: string) => {
      if (!isSupabaseConfigured()) return;

      try {
        const { error } = await supabase
          .from("tickets")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Failed to delete ticket:", error);
          return;
        }
      } catch (err) {
        console.error("Failed to delete ticket:", err);
      }
    },
    []
  );

  return {
    tickets,
    loading,
    fetchTickets,
    addTicket,
    updateTicket,
    deleteTicket,
  };
}
