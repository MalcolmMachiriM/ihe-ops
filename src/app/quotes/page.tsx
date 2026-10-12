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
import { formatDate, formatMoney } from "@/lib/format";
import { customerName, quotes, supplierName } from "@/lib/mock-data";

export default function QuotesPage() {
  return (
    <div>
      <PageHeader
        title="Quotes"
        description="Build client quotes from supplier cost prices, apply markup, set validity, and convert accepted quotes to invoices."
        actionLabel="New quote"
      />

      <div className="space-y-6">
        {quotes.map((quote) => (
          <Card
            key={quote.id}
            className="border-slate-200/80 bg-white/90 shadow-none"
          >
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="font-[family-name:var(--font-display)] text-2xl">
                  {quote.number}
                </CardTitle>
                <CardDescription className="mt-1">
                  {customerName(quote.customerId)} · v{quote.version} · valid
                  until {formatDate(quote.validUntil)}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Sell</TableHead>
                    <TableHead>Lead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className="font-medium">{line.description}</div>
                        <div className="text-xs text-slate-500">
                          {line.brand}
                        </div>
                      </TableCell>
                      <TableCell>{supplierName(line.supplierId)}</TableCell>
                      <TableCell>
                        {line.quantity} {line.unit}
                      </TableCell>
                      <TableCell>
                        {formatMoney(line.costPrice, quote.currency)}
                      </TableCell>
                      <TableCell>
                        {formatMoney(line.sellPrice, quote.currency)}
                      </TableCell>
                      <TableCell>{line.leadTimeDays}d</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
