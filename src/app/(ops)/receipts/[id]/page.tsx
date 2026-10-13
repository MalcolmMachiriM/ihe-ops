import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SharePanel } from "@/components/share-panel";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomer, getReceipt } from "@/db/queries";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const receipt = await getReceipt(id);
  if (!receipt) notFound();
  const customer = await getCustomer(receipt.customerId);

  return (
    <div>
      <PageHeader
        title={receipt.number}
        description={`${receipt.customerName} · ${formatMoney(receipt.amount, receipt.currency)}`}
      />
      <Card className="max-w-xl border-slate-200/80 bg-white/90 shadow-none">
        <CardContent className="space-y-3 pt-6 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <StatusBadge status={receipt.method} />
            <span>{formatDate(receipt.issuedAt)}</span>
          </div>
          <p>
            Invoice:{" "}
            <Link href={`/invoices/${receipt.invoiceId}`} className="text-amber-700 hover:underline">
              {receipt.invoiceNumber}
            </Link>
          </p>
          {receipt.quoteId ? (
            <p>
              Quote:{" "}
              <Link href={`/quotes/${receipt.quoteId}`} className="text-amber-700 hover:underline">
                View quote
              </Link>
            </p>
          ) : null}
          <p>
            Customer:{" "}
            <Link href={`/customers/${receipt.customerId}`} className="text-amber-700 hover:underline">
              {receipt.customerName}
            </Link>
          </p>
          <Link href={`/receipts/${receipt.id}/pdf`} className={cn(buttonVariants({ variant: "outline" }))}>
            Download PDF
          </Link>
        </CardContent>
      </Card>
      <Card className="mt-6 max-w-xl border-slate-200/80 bg-white/90 shadow-none">
        <CardHeader>
          <CardTitle>Send to the client</CardTitle>
        </CardHeader>
        <CardContent>
          <SharePanel kind="receipt" documentId={receipt.id} email={customer?.email} />
        </CardContent>
      </Card>
    </div>
  );
}
