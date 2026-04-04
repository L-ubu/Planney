"use client";

import { useState, useEffect } from "react";
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
import { useUser } from "@/components/user-provider";
import { COLORS } from "@/lib/constants";
import { WorkHour } from "@/lib/types";
import { Clock, Trash2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface WorkHourDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  editingWorkHour: WorkHour | null;
  onSave: (data: {
    date: string;
    start_time: string;
    end_time: string;
    notes: string | null;
  }) => void;
  onUpdate: (
    id: string,
    data: {
      start_time: string;
      end_time: string;
      notes: string | null;
    }
  ) => void;
  onDelete: (id: string) => void;
}

export function WorkHourDialog({
  open,
  onOpenChange,
  date,
  editingWorkHour,
  onSave,
  onUpdate,
  onDelete,
}: WorkHourDialogProps) {
  const { currentUser, colors } = useUser();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [notes, setNotes] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingWorkHour) {
      setStartTime(editingWorkHour.start_time.slice(0, 5));
      setEndTime(editingWorkHour.end_time.slice(0, 5));
      setNotes(editingWorkHour.notes ?? "");
    } else {
      setStartTime("09:00");
      setEndTime("17:00");
      setNotes("");
    }
    setShowDeleteConfirm(false);
  }, [editingWorkHour, open]);

  const handleSave = () => {
    if (!startTime || !endTime) return;

    if (editingWorkHour) {
      onUpdate(editingWorkHour.id, {
        start_time: startTime,
        end_time: endTime,
        notes: notes.trim() || null,
      });
    } else if (date) {
      onSave({
        date: format(date, "yyyy-MM-dd"),
        start_time: startTime,
        end_time: endTime,
        notes: notes.trim() || null,
      });
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (editingWorkHour) {
      onDelete(editingWorkHour.id);
      onOpenChange(false);
    }
  };

  const displayDate = editingWorkHour
    ? new Date(editingWorkHour.date + "T00:00:00")
    : date;

  // Determine whose work hour this is (for editing, use the work hour's person)
  const ownerPerson = editingWorkHour ? editingWorkHour.person : currentUser;
  const ownerColors = COLORS[ownerPerson];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="flex size-9 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: ownerColors.primary }}
            >
              <Clock className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {editingWorkHour ? "Edit Work Hours" : "Add Work Hours"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {displayDate ? format(displayDate, "EEEE, MMMM d, yyyy") : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Person indicator */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ backgroundColor: ownerColors.lightPrimary }}
        >
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: ownerColors.primary }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: ownerColors.primary }}
          >
            {ownerPerson}&apos;s work hours
          </span>
        </div>

        {/* Time inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="start-time" className="text-xs">
              Start time
            </Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-xl h-10"
              style={{
                borderColor: `${ownerColors.primary}30`,
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end-time" className="text-xs">
              End time
            </Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-xl h-10"
              style={{
                borderColor: `${ownerColors.primary}30`,
              }}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs">
            Notes{" "}
            <span style={{ color: COLORS.shared.textMuted }}>(optional)</span>
          </Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Morning shift, overtime..."
            rows={2}
            className="w-full min-w-0 rounded-xl border bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            style={{
              borderColor: `${ownerColors.primary}30`,
            }}
          />
        </div>

        {/* Delete confirmation */}
        {editingWorkHour && showDeleteConfirm && (
          <div
            className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm"
            style={{
              borderColor: "#E4432F40",
              backgroundColor: "#FEE2E210",
            }}
          >
            <AlertTriangle className="size-4 text-red-500 shrink-0" />
            <span style={{ color: COLORS.shared.text }}>
              Delete this entry?
            </span>
            <div className="ml-auto flex gap-1.5">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowDeleteConfirm(false)}
              >
                No
              </Button>
              <Button
                variant="destructive"
                size="xs"
                onClick={handleDelete}
              >
                Yes, delete
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="rounded-b-2xl">
          {editingWorkHour && !showDeleteConfirm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="mr-auto text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="text-white"
            style={{ backgroundColor: ownerColors.primary }}
          >
            {editingWorkHour ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
