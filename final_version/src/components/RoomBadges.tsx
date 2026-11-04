import { Lock, Unlock } from "lucide-react";

export function StatusBadge({ blocked, compact = false }: { blocked: boolean; compact?: boolean }) {
  const Icon = blocked ? Lock : Unlock;
  return (
    <span
      className={`inline-flex items-center rounded-full text-xs font-semibold ${
        compact ? "gap-1 px-2.5 py-0.5" : "gap-1.5 px-3 py-1"
      } ${blocked ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
    >
      <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {blocked ? "Blocked" : "Open"}
    </span>
  );
}
