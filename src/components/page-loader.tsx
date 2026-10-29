import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PageLoaderProps = {
  label?: string;
  className?: string;
};

export function PageLoader({
  label = "Loading…",
  className,
}: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500",
        className,
      )}
    >
      <Loader2
        className="size-8 animate-spin text-amber-600"
        aria-hidden
      />
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <span className="sr-only">{label}</span>
    </div>
  );
}
