import { notFound } from "next/navigation";
import { getInvoice } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { exportInvoice, mapSellLines } from "@/lib/document-export";
import { exportResponse } from "@/lib/export-response";
import { isExportFormat } from "@/lib/export-types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; format: string }> },
) {
  await requireUser();
  const { id, format } = await context.params;
  if (!isExportFormat(format)) notFound();

  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const buffer = await exportInvoice(format, {
    number: invoice.number,
    customerName: invoice.customerName,
    status: invoice.status,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    total: invoice.total,
    amountPaid: invoice.amountPaid,
    credited: invoice.credited,
    notes: invoice.notes,
    lines: mapSellLines(invoice.lines),
  });

  return exportResponse(buffer, `${invoice.number}.${format}`, format);
}
