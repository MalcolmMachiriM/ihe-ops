import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  description: string;
  actionLabel?: string;
};

export function PageHeader({
  title,
  description,
  actionLabel,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-slate-950 md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-base">
          {description}
        </p>
      </div>
      {actionLabel ? (
        <Button className="bg-slate-950 text-white hover:bg-slate-800">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
