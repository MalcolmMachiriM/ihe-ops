import Link from "next/link";
import { notFound } from "next/navigation";
import { LineTable } from "@/components/line-table";
import { CreditForm, PaymentForm } from "@/components/record-forms";
import { SharePanel } from "@/components/share-panel";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomer, getInvoice } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { canIssueCredit, canRecordPayment } from "@/lib/roles";
import { cn } from "@/lib/utils";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const user = await requireUser();
  const canPay = user.role ? canRecordPayment(user.role) : false;
  const canCredit = user.role ? canIssueCredit(user.role) : false;
  const customer = await getCustomer(invoice.customerId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.number}
        description={`${invoice.customerName} · balance ${formatMoney(invoice.balance, invoice.currency)}`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={invoice.status} />
        <span className="text-sm text-slate-500">Due {formatDate(invoice.dueDate)}</span>
        {invoice.quoteId ? (
          <Link href={`/quotes/${invoice.quoteId}`} className="text-sm text-amber-700 hover:underline">
            {invoice.quoteNumber}
          </Link>
        ) : null}
        <Link href={`/customers/${invoice.customerId}/statement`} className="text-sm text-amber-700 hover:underline">
          Statement
        </Link>
        <Link href={`/invoices/${invoice.id}/pdf`} className={cn(buttonVariants({ variant: "outline" }))}>
          Download PDF
        </Link>
      </div>
      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardContent className="pt-6">
          <LineTable lines={invoice.lines} currency={invoice.currency} showCost={false} />
        </CardContent>
      </Card>
      {invoice.payments.length > 0 ? (
        <Card className="border-slate-200/80 bg-white/90 shadow-none">
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {invoice.payments.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center gap-3">
                <span>{formatMoney(payment.amount, invoice.currency)}</span>
                <StatusBadge status={payment.method} />
                <span className="text-slate-500">{formatDate(payment.paidAt)}</span>
                {payment.receiptId ? (
                  <Link href={`/receipts/${payment.receiptId}`} className="text-amber-700 hover:underline">
                    {payment.receiptNumber}
                  </Link>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {invoice.credits.length > 0 ? (
        <Card className="border-slate-200/80 bg-white/90 shadow-none">
          <CardHeader>
            <CardTitle>Credit notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {invoice.credits.map((credit) => (
              <div key={credit.id} className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{credit.number}</span>
                <span>{formatMoney(credit.amount, credit.currency)}</span>
                <span className="text-slate-500">{credit.reason}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {canPay && invoice.balance > 0.001 && invoice.status !== "void" ? (
        <Card className="max-w-xl border-slate-200/80 bg-white/90 shadow-none">
          <CardHeader>
            <CardTitle>{invoice.status === "proforma" ? "Record deposit" : "Record payment"}</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentForm
              invoiceId={invoice.id}
              currency={invoice.currency}
              balance={invoice.balance}
              deposit={invoice.status === "proforma"}
            />
          </CardContent>
        </Card>
      ) : null}
      {canCredit && invoice.balance > 0.001 && invoice.status !== "void" ? (
        <Card className="max-w-xl border-slate-200/80 bg-white/90 shadow-none">
          <CardHeader>
            <CardTitle>Credit note</CardTitle>
          </CardHeader>
          <CardContent>
            <CreditForm invoiceId={invoice.id} currency={invoice.currency} balance={invoice.balance} />
          </CardContent>
        </Card>
      ) : null}
      <Card className="max-w-xl border-slate-200/80 bg-white/90 shadow-none">
        <CardHeader>
          <CardTitle>Send to the client</CardTitle>
        </CardHeader>
        <CardContent>
          <SharePanel kind="invoice" documentId={invoice.id} email={customer?.email} />
        </CardContent>
      </Card>
    </div>
  );
}
