import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formats = [
  { format: "pdf", label: "PDF" },
  { format: "docx", label: "Word" },
  { format: "xlsx", label: "Excel" },
] as const;

export function ExportMenu({
  baseHref,
  className,
}: {
  baseHref: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-slate-500">Export</span>
      {formats.map((item) => (
        <Link
          key={item.format}
          href={`${baseHref}/${item.format}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
