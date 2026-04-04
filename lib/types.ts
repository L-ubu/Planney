export type Person = "Luca" | "Vale";

export interface WorkHour {
  id: string;
  person: Person;
  date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
}

export interface FinanceEntry {
  id: string;
  person: Person;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string | null;
  date: string;
  is_recurring: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  created_by: Person;
  assigned_to: Person;
  title: string;
  description: string | null;
  category: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "done";
  created_at: string;
  updated_at: string;
}
