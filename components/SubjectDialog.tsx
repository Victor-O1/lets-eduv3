"use client";

import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Subject } from "@/lib/types";

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // if subject exists → EDIT
  subject?: Subject;

  onSubmit: (data: { name: string; color: string }) => void;
}

export default function SubjectDialog({
  open,
  onOpenChange,
  subject,
  onSubmit,
}: SubjectDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366F1");

  // preload when editing
  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setColor(subject.color);
    } else {
      setName("");
      setColor("#6366F1");
    }
  }, [subject, open]);

  function handleSubmit() {
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      color,
    });

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subject ? "Edit Subject" : "Add Subject"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* NAME INPUT */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Subject name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mathematics"
            />
          </div>

          {/* COLOR PICKER */}
          <div className="space-y-3">
            <label className="text-sm text-slate-400">Subject color</label>

            <div className="flex items-center gap-4">
              <HexColorPicker color={color} onChange={setColor} />

              {/* COLOR PREVIEW */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-12 h-12 rounded-full border"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-slate-400">
                  {color.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {subject ? "Save changes" : "Add subject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
