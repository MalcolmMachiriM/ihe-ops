import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listInvoices } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { canIssueInvoice } from "@/lib/roles";

export default async function InvoicesPage() {
  const user = await requireUser();
  const invoices = await listInvoices();

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Issue proformas for deposits before ordering from suppliers, then convert to tax invoices as goods are delivered."
        actionLabel={user.role && canIssueInvoice(user.role) ? "New invoice" : undefined}
        actionHref="/quotes"
      />
      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardHeader>
          <CardTitle>Billing documents</CardTitle>
          <CardDescription>Track paid, partial, and outstanding balances.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link href={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                      {invoice.number}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell>{formatMoney(invoice.total, invoice.currency)}</TableCell>
                  <TableCell>{formatMoney(invoice.amountPaid, invoice.currency)}</TableCell>
                  <TableCell>
                    {formatMoney(invoice.balance, invoice.currency)}
                  </TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
