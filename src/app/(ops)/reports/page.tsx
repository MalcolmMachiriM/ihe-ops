import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOperationsReport } from "@/db/reports";
import { formatMoney } from "@/lib/format";

export default async function ReportsPage() {
  const report = await getOperationsReport();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Pipeline and margin stay in their own currency. USD and ZiG are never added together."
      />
      <ReportTable
        title="Pipeline"
        rows={report.pipeline.map((row) => ({
          label: row.status,
          currency: row.currency,
          detail: `${row.count} quotes`,
          amount: formatMoney(row.amount, row.currency),
        }))}
      />
      <MarginTable title="Margin by quote" rows={report.byQuote} />
      <MarginTable title="Margin by category" rows={report.byCategory} />
      <MarginTable title="Margin by salesperson" rows={report.bySalesperson} />
      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardHeader>
          <CardTitle>Receivables ageing</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>1–30</TableHead>
                <TableHead>31–60</TableHead>
                <TableHead>61–90</TableHead>
                <TableHead>90+</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.ageing.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>Nothing outstanding.</TableCell>
                </TableRow>
              ) : (
                report.ageing.map((row) => (
                  <TableRow key={row.currency}>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell>{formatMoney(row.current, row.currency)}</TableCell>
                    <TableCell>{formatMoney(row.d30, row.currency)}</TableCell>
                    <TableCell>{formatMoney(row.d60, row.currency)}</TableCell>
                    <TableCell>{formatMoney(row.d90, row.currency)}</TableCell>
                    <TableCell>{formatMoney(row.older, row.currency)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <p className="mt-3 text-sm text-slate-500">
            Customer statements live on each{" "}
            <Link href="/customers" className="text-amber-700 hover:underline">
              customer
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function MarginTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; currency: string; cost: number; sell: number }[];
}) {
  return (
    <Card className="border-slate-200/80 bg-white/90 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sell</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No quotes yet.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const margin = row.sell - row.cost;
                const percent = row.sell > 0 ? (margin / row.sell) * 100 : 0;
                return (
                  <TableRow key={`${row.label}-${row.currency}`}>
                    <TableCell>
                      {row.label} · {row.currency}
                    </TableCell>
                    <TableCell>{formatMoney(row.sell, row.currency)}</TableCell>
                    <TableCell>{formatMoney(row.cost, row.currency)}</TableCell>
                    <TableCell>
                      {formatMoney(margin, row.currency)} ({percent.toFixed(1)}%)
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ReportTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; currency: string; detail: string; amount: string }[];
}) {
  return (
    <Card className="border-slate-200/80 bg-white/90 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>No open quotes.</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={`${row.label}-${row.currency}`}>
                  <TableCell>
                    {row.label} · {row.currency}
                  </TableCell>
                  <TableCell>{row.detail}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
