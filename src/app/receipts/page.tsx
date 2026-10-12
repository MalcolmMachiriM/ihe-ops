import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMoney, statusLabel } from "@/lib/format";
import { customerName, invoices, receipts } from "@/lib/mock-data";

export default function ReceiptsPage() {
  return (
    <div>
      <PageHeader
        title="Receipts"
        description="Official payment acknowledgements for cash, EcoCash, bank transfer, and swipe settlements."
        actionLabel="Record payment"
      />

      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardHeader>
          <CardTitle>Issued receipts</CardTitle>
          <CardDescription>
            Each receipt links back to an invoice payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => {
                const invoice = invoices.find(
                  (item) => item.id === receipt.invoiceId,
                );
                return (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">
                      {receipt.number}
                    </TableCell>
                    <TableCell>{customerName(receipt.customerId)}</TableCell>
                    <TableCell>{invoice?.number ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={receipt.method} />
                    </TableCell>
                    <TableCell>
                      {formatMoney(receipt.amount, receipt.currency)}
                    </TableCell>
                    <TableCell>{formatDate(receipt.issuedAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {receipts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No receipts yet. Record a payment against an invoice to issue one.
            </p>
          ) : null}
          <p className="mt-4 text-xs text-slate-500">
            Payment methods supported: {statusLabel("cash")}, EcoCash, bank
            transfer, swipe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
