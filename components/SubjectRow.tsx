"use client";

import { Subject } from "@/lib/types";
import { MoreVertical } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function SubjectRow({
  subject,
  active,
  totalMinutes,
  onSelect,
  onEdit,
  onDelete,
}: {
  subject: Subject;
  active: boolean;
  totalMinutes?: number;
  onSelect: () => void;
  onEdit?: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer
    transition-all
    ${
      active
        ? "bg-[#1E1B4B] ring-1 ring-indigo-500 animate-[pulseSoft_2s_ease-in-out_infinite]"
        : "hover:bg-[#0F1424]"
    }`}
    >
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: subject.color }}
        />
        <span>{subject.name}</span>
      </div>

      {/* RIGHT */}
      <div
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {typeof totalMinutes === "number" && (
          <span className="text-xs text-slate-400">{totalMinutes} min</span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md hover:bg-[#1E1B4B]">
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onEdit?.(subject)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(subject)}>
              Add missed sessions
            </DropdownMenuItem>

            {/* DELETE WITH CONFIRM */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
                  onSelect={(e) => e.preventDefault()} // important
                >
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete subject?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove <b>{subject.name}</b>. Past sessions will
                    be preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => onDelete?.(subject)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
