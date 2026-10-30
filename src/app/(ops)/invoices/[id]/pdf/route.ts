import { notFound } from "next/navigation";
import { getInvoice } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { exportInvoice, mapSellLines } from "@/lib/document-export";
import { pdfResponse } from "@/lib/pdf-response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireUser();
  const { id } = await context.params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const buffer = await exportInvoice("pdf", {
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

  return pdfResponse(buffer, `${invoice.number}.pdf`);
}
