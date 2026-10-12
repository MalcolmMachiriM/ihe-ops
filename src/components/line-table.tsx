import { formatMoney, num } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Line = {
  id: string;
  description: string;
  brand: string | null;
  quantity: string;
  unit: string;
  costPrice: string;
  sellPrice: string;
  supplierName: string | null;
  leadTimeDays: number | null;
};

export function LineTable({
  lines,
  currency,
  showCost,
}: {
  lines: Line[];
  currency: string;
  showCost: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Qty</TableHead>
          {showCost ? <TableHead>Cost</TableHead> : null}
          <TableHead>Sell</TableHead>
          <TableHead>Lead</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => (
          <TableRow key={line.id}>
            <TableCell>
              <div className="font-medium">{line.description}</div>
              {line.brand ? (
                <div className="text-xs text-slate-500">{line.brand}</div>
              ) : null}
            </TableCell>
            <TableCell>{line.supplierName ?? "—"}</TableCell>
            <TableCell>
              {num(line.quantity)} {line.unit}
            </TableCell>
            {showCost ? (
              <TableCell>{formatMoney(line.costPrice, currency)}</TableCell>
            ) : null}
            <TableCell>{formatMoney(line.sellPrice, currency)}</TableCell>
            <TableCell>
              {line.leadTimeDays == null ? "—" : `${line.leadTimeDays}d`}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
