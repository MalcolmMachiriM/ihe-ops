import Link from "next/link";
import { notFound } from "next/navigation";
import { setPurchaseOrderStatus } from "@/actions/sourcing";
import { ExportMenu } from "@/components/export-menu";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPurchaseOrder } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { formatMoney, num } from "@/lib/format";
import { canSource } from "@/lib/roles";


export default async function PurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPurchaseOrder(id);
  if (!order) notFound();
  const user = await requireUser();
  const canEdit = user.role ? canSource(user.role) : false;

  return (
    <div>
      <PageHeader title={order.number} description={`${order.supplierName} · ${order.quoteNumber}`} />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <StatusBadge status={order.status} />
        <Link href={`/quotes/${order.quoteId}`} className="text-amber-700 hover:underline">
          {order.quoteNumber}
        </Link>
        {order.enquiryId ? (
          <Link href={`/enquiries/${order.enquiryId}`} className="text-amber-700 hover:underline">
            Enquiry
          </Link>
        ) : null}
        <ExportMenu baseHref={`/purchase-orders/${order.id}/export`} />
      </div>
      {order.notes ? <p className="mb-4 max-w-2xl text-sm text-slate-600">{order.notes}</p> : null}
      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Lead</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <div className="font-medium">{line.description}</div>
                    <div className="text-xs text-slate-500">{line.brand}</div>
                  </TableCell>
                  <TableCell>
                    {num(line.quantity)} {line.unit}
                  </TableCell>
                  <TableCell>{formatMoney(line.costPrice, order.currency)}</TableCell>
                  <TableCell>{line.leadTimeDays ?? "—"}d</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {canEdit ? (
        <div className="mt-4 flex gap-2">
          {(["draft", "sent", "cancelled"] as const).map((status) => (
            <form key={status} action={setPurchaseOrderStatus}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="status" value={status} />
              <button
                type="submit"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm capitalize"
              >
                Mark {status}
              </button>
            </form>
          ))}
        </div>
      ) : null}
    </div>
  );
}
