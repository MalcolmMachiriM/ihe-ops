import Link from "next/link";
import { LineTable } from "@/components/line-table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listQuotes } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { canEditQuotes } from "@/lib/roles";

export default async function QuotesPage() {
  const user = await requireUser();
  const quotes = await listQuotes();

  return (
    <div>
      <PageHeader
        title="Quotes"
        description="Build client quotes from supplier cost prices, apply markup, set validity, and convert accepted quotes to invoices."
        actionLabel={user.role && canEditQuotes(user.role) ? "New quote" : undefined}
        actionHref="/quotes/new"
      />
      <div className="space-y-6">
        {quotes.map((quote) => (
          <Card key={quote.id} className="border-slate-200/80 bg-white/90 shadow-none">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="font-[family-name:var(--font-display)] text-2xl">
                  <Link href={`/quotes/${quote.id}`} className="hover:underline">
                    {quote.number}
                  </Link>
                </CardTitle>
                <CardDescription className="mt-1">
                  {quote.customerName} · v{quote.version} · valid until {formatDate(quote.validUntil)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={quote.status} />
                <p className="font-[family-name:var(--font-display)] text-xl text-slate-950">
                  {formatMoney(quote.total, quote.currency)}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <LineTable lines={quote.lines} currency={quote.currency} showCost />
            </CardContent>
          </Card>
        ))}
        {quotes.length === 0 ? (
          <p className="text-sm text-slate-500">No quotes yet.</p>
        ) : null}
      </div>
    </div>
  );
}
