import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
import {
  customerName,
  dashboardStats,
  enquiries,
  invoices,
  quotes,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const stats = dashboardStats();

  const cards = [
    {
      label: "Open enquiries",
      value: String(stats.openEnquiries),
      hint: "Awaiting source or quote",
    },
    {
      label: "Open quotes",
      value: String(stats.openQuotes),
      hint: "Draft or sent to clients",
    },
    {
      label: "Quote pipeline",
      value: formatMoney(stats.quotePipeline),
      hint: "Value still in play",
    },
    {
      label: "Receivables",
      value: formatMoney(stats.receivables),
      hint: "Outstanding on invoices",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Today at IHE"
        description="Track requests as they move from supplier sourcing to quote, invoice, and receipt — without needing warehouse stock."
        actionLabel="New enquiry"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.label}
            className="border-slate-200/80 bg-white/90 shadow-none"
          >
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="font-[family-name:var(--font-display)] text-3xl">
                {card.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200/80 bg-white/90 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent enquiries</CardTitle>
              <CardDescription>
                Source from suppliers, then convert to a quote.
              </CardDescription>
            </div>
            <Link
              href="/enquiries"
              className="inline-flex items-center gap-1 text-sm text-amber-700 hover:text-amber-900"
            >
              View all <ArrowUpRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enquiries.map((enquiry) => (
                  <TableRow key={enquiry.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {enquiry.reference}
                      </div>
                      <div className="text-xs text-slate-500">
                        {enquiry.title}
                      </div>
                    </TableCell>
                    <TableCell>{customerName(enquiry.customerId)}</TableCell>
                    <TableCell>
                      <StatusBadge status={enquiry.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Quotes & invoices</CardTitle>
              <CardDescription>
                Accepted quotes become proformas or tax invoices.
              </CardDescription>
            </div>
            <Link
              href="/quotes"
              className="inline-flex items-center gap-1 text-sm text-amber-700 hover:text-amber-900"
            >
              Quotes <ArrowUpRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Valid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <div className="font-medium">{quote.number}</div>
                      <StatusBadge status={quote.status} />
                    </TableCell>
                    <TableCell>
                      {formatMoney(quote.total, quote.currency)}
                    </TableCell>
                    <TableCell>{formatDate(quote.validUntil)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="font-medium">{invoice.number}</div>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell>
                      {formatMoney(
                        invoice.total - invoice.amountPaid,
                        invoice.currency,
                      )}
                    </TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
