"use client";

export type Subject = {
  id: string;
  name: string;
  color: string;
};

export default function SubjectList({
  subjects,
  activeId,
  onSelect,
}: {
  subjects: Subject[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {subjects.map((s) => (
        <div
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`cursor-pointer flex items-center gap-3 p-3 rounded-lg
            ${
              activeId === s.id
                ? "bg-indigo-900 text-white"
                : "bg-[#0F1424] text-slate-300"
            }`}
        >
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: s.color }}
          />
          {s.name}
        </div>
      ))}
    </div>
  );
}
