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
import { listProductTemplates } from "@/db/queries";
import { formatDate, formatMoney } from "@/lib/format";

export default async function ProductsPage() {
  const products = await listProductTemplates();

  return (
    <div>
      <PageHeader
        title="Product templates"
        description="Last known supplier cost. Saving a quote updates these figures. This is not warehouse stock."
      />
      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Last cost</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>Costs appear here after the first quote is saved.</TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.name}
                      {product.brand ? ` · ${product.brand}` : ""}
                      <span className="block text-xs text-slate-500">{product.unit}</span>
                    </TableCell>
                    <TableCell>{product.supplierName || "—"}</TableCell>
                    <TableCell>{formatMoney(product.lastCost, product.currency)}</TableCell>
                    <TableCell>{formatDate(product.updatedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
