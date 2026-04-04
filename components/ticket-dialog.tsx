"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useUser } from "@/components/user-provider";
import { TICKET_CATEGORIES, PEOPLE, COLORS } from "@/lib/constants";
import { Ticket, Person } from "@/lib/types";
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

interface TicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: Ticket | null;
  onSave: (data: {
    title: string;
    description?: string | null;
    assigned_to: Person;
    category: string;
    priority: "low" | "medium" | "high";
    status?: "open" | "in_progress" | "done";
  }) => void;
  onDelete?: (id: string) => void;
}

const PRIORITY_OPTIONS: { value: "low" | "medium" | "high"; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "#22c55e" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "high", label: "High", color: "#ef4444" },
];

const STATUS_OPTIONS: { value: "open" | "in_progress" | "done"; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export function TicketDialog({
  open,
  onOpenChange,
  ticket,
  onSave,
  onDelete,
}: TicketDialogProps) {
  const { currentUser, colors } = useUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<Person>(currentUser);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [status, setStatus] = useState<"open" | "in_progress" | "done">("open");

  const isEditing = !!ticket;

  // Reset form when dialog opens or ticket changes
  useEffect(() => {
    if (open) {
      if (ticket) {
        setTitle(ticket.title);
        setDescription(ticket.description ?? "");
        setAssignedTo(ticket.assigned_to);
        setCategory(ticket.category);
        setPriority(ticket.priority);
        setStatus(ticket.status);
      } else {
        setTitle("");
        setDescription("");
        setAssignedTo(currentUser);
        setCategory("");
        setPriority("medium");
        setStatus("open");
      }
    }
  }, [open, ticket, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!category) return;

    onSave({
      title: title.trim(),
      description: description.trim() || null,
      assigned_to: assignedTo,
      category,
      priority,
      ...(isEditing ? { status } : {}),
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (ticket && onDelete) {
      onDelete(ticket.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Ticket" : "New Ticket"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this ticket."
              : "Create a new ticket or task."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-title">Title</Label>
            <Input
              id="ticket-title"
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-description">
              Description{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <textarea
              id="ticket-description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Assign to */}
          <div className="flex flex-col gap-1.5">
            <Label>Assign to</Label>
            <div
              className="flex gap-1 rounded-lg p-1"
              style={{ backgroundColor: COLORS.shared.background }}
            >
              {PEOPLE.map((person) => {
                const personColors = COLORS[person];
                const isActive = assignedTo === person;
                return (
                  <button
                    key={person}
                    type="button"
                    onClick={() => setAssignedTo(person)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all"
                    style={{
                      backgroundColor: isActive
                        ? personColors.primary
                        : "transparent",
                      color: isActive ? "#fff" : COLORS.shared.textMuted,
                    }}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{
                        backgroundColor: isActive
                          ? "rgba(255,255,255,0.5)"
                          : personColors.primary,
                      }}
                    />
                    {person}
                  </button>
                );
              })}
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
                {TICKET_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1.5">
            <Label>Priority</Label>
            <div
              className="flex gap-1 rounded-lg p-1"
              style={{ backgroundColor: COLORS.shared.background }}
            >
              {PRIORITY_OPTIONS.map((opt) => {
                const isActive = priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all"
                    style={{
                      backgroundColor: isActive ? opt.color : "transparent",
                      color: isActive ? "#fff" : COLORS.shared.textMuted,
                    }}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{
                        backgroundColor: isActive
                          ? "rgba(255,255,255,0.5)"
                          : opt.color,
                      }}
                    />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status (only when editing) */}
          {isEditing && (
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <div
                className="flex gap-1 rounded-lg p-1"
                style={{ backgroundColor: COLORS.shared.background }}
              >
                {STATUS_OPTIONS.map((opt) => {
                  const isActive = status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className="flex flex-1 items-center justify-center rounded-md py-2 text-sm font-medium transition-all"
                      style={{
                        backgroundColor: isActive
                          ? colors.primary
                          : "transparent",
                        color: isActive ? "#fff" : COLORS.shared.textMuted,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
              disabled={!title.trim() || !category}
            >
              {isEditing ? "Update" : "Create Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
