import { notFound } from "next/navigation";
import { getPurchaseOrder } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { exportPurchaseOrder, mapCostLines } from "@/lib/document-export";
import { exportResponse } from "@/lib/export-response";
import { isExportFormat } from "@/lib/export-types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; format: string }> },
) {
  await requireUser();
  const { id, format } = await context.params;
  if (!isExportFormat(format)) notFound();

  const order = await getPurchaseOrder(id);
  if (!order) notFound();

  const buffer = await exportPurchaseOrder(format, {
    number: order.number,
    supplierName: order.supplierName,
    quoteNumber: order.quoteNumber,
    status: order.status,
    currency: order.currency,
    notes: order.notes,
    lines: mapCostLines(order.lines),
  });

  return exportResponse(buffer, `${order.number}.${format}`, format);
}
