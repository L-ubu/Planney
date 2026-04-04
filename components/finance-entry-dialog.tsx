"use client";

import { useState, useEffect } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { useUser } from "@/components/user-provider";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, COLORS } from "@/lib/constants";
import { FinanceEntry } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FinanceEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: FinanceEntry | null;
  onSave: (data: {
    type: "income" | "expense";
    amount: number;
    category: string;
    description?: string | null;
    date: string;
    is_recurring: boolean;
  }) => void;
  onDelete?: (id: string) => void;
}

export function FinanceEntryDialog({
  open,
  onOpenChange,
  entry,
  onSave,
  onDelete,
}: FinanceEntryDialogProps) {
  const { colors } = useUser();

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [isRecurring, setIsRecurring] = useState(false);

  const isEditing = !!entry;
  const categories =
    type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Reset form when dialog opens or entry changes
  useEffect(() => {
    if (open) {
      if (entry) {
        setType(entry.type);
        setAmount(String(entry.amount));
        setCategory(entry.category);
        setDescription(entry.description ?? "");
        setDate(entry.date);
        setIsRecurring(entry.is_recurring);
      } else {
        setType("expense");
        setAmount("");
        setCategory("");
        setDescription("");
        const now = new Date();
        setDate(
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
        );
        setIsRecurring(false);
      }
    }
  }, [open, entry]);

  // Reset category when type changes (unless editing and category is valid)
  useEffect(() => {
    const cats: readonly string[] =
      type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (category && !cats.includes(category)) {
      setCategory("");
    }
  }, [type, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!category) return;

    onSave({
      type,
      amount: parsedAmount,
      category,
      description: description.trim() || null,
      date,
      is_recurring: isRecurring,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (entry && onDelete) {
      onDelete(entry.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Entry" : "Add Entry"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this finance entry."
              : "Add a new income or expense entry."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Type Toggle */}
          <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: COLORS.shared.background }}>
            <button
              type="button"
              onClick={() => setType("expense")}
              className="flex-1 rounded-md py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor:
                  type === "expense" ? colors.accent : "transparent",
                color:
                  type === "expense" ? "#fff" : COLORS.shared.textMuted,
              }}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className="flex-1 rounded-md py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor:
                  type === "income" ? "#16a34a" : "transparent",
                color:
                  type === "income" ? "#fff" : COLORS.shared.textMuted,
              }}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                EUR
              </span>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(val) => setCategory(val ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">
              Description{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="e.g. Weekly groceries..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Recurring Toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={isRecurring}
              onClick={() => setIsRecurring(!isRecurring)}
              className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
              style={{
                backgroundColor: isRecurring
                  ? colors.primary
                  : COLORS.shared.border,
              }}
            >
              <span
                className="inline-block size-4 rounded-full bg-white shadow-sm transition-transform"
                style={{
                  transform: isRecurring
                    ? "translateX(24px)"
                    : "translateX(4px)",
                }}
              />
            </button>
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <RefreshCw className="size-3.5" style={{ color: COLORS.shared.textMuted }} />
              Recurring
            </span>
          </label>

          {/* Footer */}
          <DialogFooter className="gap-2 sm:gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="mr-auto"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              style={{ backgroundColor: colors.primary }}
              disabled={!amount || !category || parseFloat(amount) <= 0}
            >
              {isEditing ? "Update" : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
