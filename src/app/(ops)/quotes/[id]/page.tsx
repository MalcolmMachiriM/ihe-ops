import Link from "next/link";
import { notFound } from "next/navigation";
import { LineTable } from "@/components/line-table";
import { QuoteForm } from "@/components/quote-form";
import { ConvertQuoteButtons } from "@/components/record-forms";
import { SharePanel } from "@/components/share-panel";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PurchaseOrderButton, QuoteReasons } from "@/components/sourcing-board";
import {
  getCustomer,
  getQuote,
  getQuoteReasons,
  listApprovalsForQuote,
  listAudit,
  listCustomers,
  listEnquiries,
  listProductTemplates,
  listPurchaseOrdersForQuote,
  listSuppliers,
  quoteCanRaisePurchaseOrder,
} from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { canCreateProforma, canEditQuotes, canIssueInvoice, canSource } from "@/lib/roles";
import { cn } from "@/lib/utils";

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const user = await requireUser();
  const canEdit = user.role ? canEditQuotes(user.role) : false;
  const canConvert = quote.status === "sent" || quote.status === "accepted";
  const [customers, suppliers, enquiries, reasons, orders, canOrder, templates, approvals, history, customer] =
    await Promise.all([
      canEdit ? listCustomers() : Promise.resolve([]),
      canEdit ? listSuppliers() : Promise.resolve([]),
      canEdit ? listEnquiries() : Promise.resolve([]),
      quote.enquiryId ? getQuoteReasons(quote.enquiryId) : Promise.resolve([]),
      listPurchaseOrdersForQuote(quote.id),
      quoteCanRaisePurchaseOrder(quote.id),
      canEdit ? listProductTemplates() : Promise.resolve([]),
      listApprovalsForQuote(quote.id),
      listAudit("quote", quote.id),
      getCustomer(quote.customerId),
    ]);
  const canRaiseOrder = Boolean(user.role && canSource(user.role) && canOrder);
  const pending = approvals.find((approval) => approval.status === "pending");

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
      {notice === "approval" || pending ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Saved as a draft. An admin must approve this margin before it can be sent.
          {pending?.reason ? ` ${pending.reason}.` : ""}
        </p>
      ) : null}
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
      <QuoteReasons lines={quote.lines} items={reasons} />
      {orders.length > 0 ? (
        <p className="mb-4 text-sm text-slate-600">
          Purchase orders:{" "}
          {orders.map((order) => (
            <Link key={order.id} href={`/purchase-orders/${order.id}`} className="mr-3 text-amber-700 hover:underline">
              {order.number}
            </Link>
          ))}
        </p>
      ) : null}
      {canRaiseOrder ? (
        <div className="mb-6">
          <PurchaseOrderButton quoteId={quote.id} />
        </div>
      ) : null}
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
              templates={templates.map((template) => ({
                id: template.id,
                name: template.name,
                brand: template.brand,
                unit: template.unit,
                lastCost: template.lastCost,
                currency: template.currency,
                supplierId: template.supplierId,
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
      <Card className="mt-6 max-w-xl border-slate-200/80 bg-white/90 shadow-none">
        <CardHeader>
          <CardTitle>Send to the client</CardTitle>
        </CardHeader>
        <CardContent>
          <SharePanel kind="quote" documentId={quote.id} email={customer?.email} />
        </CardContent>
      </Card>
      {history.length > 0 ? (
        <Card className="mt-6 border-slate-200/80 bg-white/90 shadow-none">
          <CardHeader>
            <CardTitle>Price and term history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            {history.map((event) => (
              <p key={event.id}>
                <span className="text-slate-500">{formatDate(event.createdAt)} · </span>
                {event.summary}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
