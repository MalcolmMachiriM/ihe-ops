import { quoteSla } from "@/lib/sla";
import { cn } from "@/lib/utils";

const toneClass = {
  met: "bg-emerald-100 text-emerald-950",
  open: "bg-sky-100 text-sky-950",
  late: "bg-amber-100 text-amber-950",
  overdue: "bg-rose-100 text-rose-950",
} as const;

export function SlaBadge({
  openedAt,
  quotedAt,
}: {
  openedAt: Date | string;
  quotedAt: Date | string | null;
}) {
  const sla = quoteSla(openedAt, quotedAt);
  return (
    <span className={cn("inline-flex rounded-md px-2 py-1 text-xs font-medium", toneClass[sla.tone])}>
      {sla.label}
    </span>
  );
}
