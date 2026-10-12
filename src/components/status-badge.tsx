import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  new: "bg-sky-100 text-sky-900 border-sky-200",
  sourcing: "bg-amber-100 text-amber-950 border-amber-200",
  quoted: "bg-indigo-100 text-indigo-950 border-indigo-200",
  won: "bg-emerald-100 text-emerald-950 border-emerald-200",
  lost: "bg-rose-100 text-rose-950 border-rose-200",
  expired: "bg-slate-100 text-slate-700 border-slate-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-sky-100 text-sky-900 border-sky-200",
  accepted: "bg-emerald-100 text-emerald-950 border-emerald-200",
  rejected: "bg-rose-100 text-rose-950 border-rose-200",
  proforma: "bg-violet-100 text-violet-950 border-violet-200",
  issued: "bg-sky-100 text-sky-900 border-sky-200",
  partial: "bg-amber-100 text-amber-950 border-amber-200",
  paid: "bg-emerald-100 text-emerald-950 border-emerald-200",
  void: "bg-slate-100 text-slate-700 border-slate-200",
  high: "bg-rose-100 text-rose-950 border-rose-200",
  normal: "bg-slate-100 text-slate-700 border-slate-200",
  low: "bg-emerald-100 text-emerald-950 border-emerald-200",
  cash: "bg-emerald-100 text-emerald-950 border-emerald-200",
  ecocash: "bg-sky-100 text-sky-900 border-sky-200",
  bank_transfer: "bg-indigo-100 text-indigo-950 border-indigo-200",
  swipe: "bg-amber-100 text-amber-950 border-amber-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-md font-medium", toneMap[status] ?? toneMap.draft)}
    >
      {statusLabel(status)}
    </Badge>
  );
}
