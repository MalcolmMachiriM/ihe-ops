import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomerStatement } from "@/db/reports";
import { formatDate, formatMoney } from "@/lib/format";

export default async function StatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const statement = await getCustomerStatement(id);
  if (!statement) notFound();

  return (
    <div>
      <PageHeader
        title={`${statement.customer.name} statement`}
        description="Invoices increase the balance. Payments and credit notes reduce it. Each currency stands on its own."
      />
      <p className="mb-4 text-sm">
        <Link href={`/customers/${statement.customer.id}`} className="text-amber-700 hover:underline">
          Back to customer
        </Link>
      </p>
      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Debit</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statement.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No invoices yet.</TableCell>
                </TableRow>
              ) : (
                statement.rows.map((row, index) => (
                  <TableRow key={`${row.label}-${index}`}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>{row.debit ? formatMoney(row.debit, row.currency) : "—"}</TableCell>
                    <TableCell>{row.credit ? formatMoney(row.credit, row.currency) : "—"}</TableCell>
                    <TableCell>{formatMoney(row.balance, row.currency)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {statement.balances.length > 0 ? (
            <div className="mt-4 space-y-1 text-sm text-slate-700">
              {statement.balances.map(([currency, amount]) => (
                <p key={currency}>
                  Balance {currency}: {formatMoney(amount, currency)}
                </p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
