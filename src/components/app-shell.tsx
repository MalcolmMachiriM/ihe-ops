"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Menu,
  PackageSearch,
  Receipt,
  ScrollText,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/enquiries", label: "Enquiries", icon: PackageSearch },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: ScrollText },
  { href: "/receipts", label: "Receipts", icon: Receipt },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {nav.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-amber-500 text-slate-950"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <Icon className="pointer-events-none size-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function BrandBlock() {
  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-amber-400">
        Infinite Hardware & Electrical
      </p>
      <p className="mt-2 text-sm text-slate-300">
        Gweru HQ · Supplier-sourced quotes
      </p>
    </div>
  );
}

function SidebarChrome({
  onClose,
  showClose,
  onNavigate,
}: {
  onClose?: () => void;
  showClose?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col px-5 py-6">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white">
            IHE Ops
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Quote · Source · Invoice · Receipt
          </p>
        </div>
        {showClose ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      <NavLinks onNavigate={onNavigate} />
      <BrandBlock />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed_0%,_transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef2f6_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        {/* Desktop sidebar — never transformed or pointer-event gated */}
        <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950 text-slate-100 lg:block">
          <SidebarChrome />
        </aside>

        {/* Mobile drawer — isolated from desktop */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-slate-950 text-slate-100 transition-transform duration-200 ease-out lg:hidden",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarChrome
            showClose
            onClose={() => setOpen(false)}
            onNavigate={() => setOpen(false)}
          />
        </aside>

        {open ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setOpen(true)}
              >
                <Menu className="size-4" />
              </Button>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Operations workspace
                </p>
                <p className="text-xs text-slate-500">
                  Mock data mode · connect Neon when ready
                </p>
              </div>
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
              Est. 2019 · Zimbabwe
            </div>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
