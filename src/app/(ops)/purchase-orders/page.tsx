import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listPurchaseOrders } from "@/db/queries";
import { formatDate } from "@/lib/format";

export default async function PurchaseOrdersPage() {
  const orders = await listPurchaseOrders();

  return (
    <div>
      <PageHeader
        title="Purchase orders"
        description="Optional orders to suppliers after the client accepts a quote or pays a deposit."
      />
      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardHeader>
          <CardTitle>Supplier orders</CardTitle>
          <CardDescription>One order per supplier, at cost, from the accepted quote lines.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/purchase-orders/${order.id}`} className="font-medium hover:underline">
                      {order.number}
                    </Link>
                  </TableCell>
                  <TableCell>{order.supplierName}</TableCell>
                  <TableCell>
                    <Link href={`/quotes/${order.quoteId}`} className="hover:underline">
                      {order.quoteNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No purchase orders yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
