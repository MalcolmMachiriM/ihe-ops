import Link from "next/link";
import { notFound } from "next/navigation";
import { LineTable } from "@/components/line-table";
import { QuoteForm } from "@/components/quote-form";
import { ConvertQuoteButtons } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getQuote, listCustomers, listEnquiries, listSuppliers } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { canCreateProforma, canEditQuotes, canIssueInvoice } from "@/lib/roles";
import { cn } from "@/lib/utils";

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const user = await requireUser();
  const canEdit = user.role ? canEditQuotes(user.role) : false;
  const canConvert = quote.status === "sent" || quote.status === "accepted";
  const [customers, suppliers, enquiries] = canEdit
    ? await Promise.all([listCustomers(), listSuppliers(), listEnquiries()])
    : [[], [], []];

  return (
    <div>
      <PageHeader title={quote.number} description={`${quote.customerName} · ${formatMoney(quote.total, quote.currency)}`} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={quote.status} />
        <span className="text-sm text-slate-500">Version {quote.version}</span>
        <Link href={`/quotes/${quote.id}/pdf`} className={cn(buttonVariants({ variant: "outline" }))}>
          Download PDF
        </Link>
      </div>
      {canConvert && user.role ? (
        <div className="mb-6">
          <ConvertQuoteButtons
            quoteId={quote.id}
            canProforma={canCreateProforma(user.role)}
            canInvoice={canIssueInvoice(user.role)}
          />
        </div>
      ) : (
        <p className="mb-6 text-sm text-slate-500">Mark the quote as sent before converting it.</p>
      )}
      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardContent className="pt-6">
          {canEdit ? (
            <QuoteForm
              customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))}
              suppliers={suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name }))}
              enquiries={enquiries.map((item) => ({
                id: item.id,
                reference: item.reference,
                title: item.title,
                customerId: item.customerId,
              }))}
              defaults={{
                id: quote.id,
                enquiryId: quote.enquiryId,
                customerId: quote.customerId,
                status: quote.status,
                currency: quote.currency,
                validUntil: quote.validUntil,
                notes: quote.notes,
                terms: quote.terms,
                version: quote.version,
                lines: quote.lines,
              }}
            />
          ) : (
            <LineTable lines={quote.lines} currency={quote.currency} showCost />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
