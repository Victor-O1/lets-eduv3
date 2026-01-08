"use client";

import { Plus } from "lucide-react";

export default function AddSubjectButton({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="mt-3 w-full flex items-center justify-center gap-2
                 px-3 py-2 rounded-md border border-dashed
                 border-slate-600 text-slate-400
                 hover:bg-[#0F1424] hover:text-white"
    >
      <Plus className="w-4 h-4" />
      Add Subject
    </button>
  );
}
