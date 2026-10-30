import { notFound } from "next/navigation";
import { getReceipt } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { exportReceipt } from "@/lib/document-export";
import { exportResponse } from "@/lib/export-response";
import { isExportFormat } from "@/lib/export-types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; format: string }> },
) {
  await requireUser();
  const { id, format } = await context.params;
  if (!isExportFormat(format)) notFound();

  const receipt = await getReceipt(id);
  if (!receipt) notFound();

  const buffer = await exportReceipt(format, {
    number: receipt.number,
    customerName: receipt.customerName,
    invoiceNumber: receipt.invoiceNumber,
    method: receipt.method,
    amount: receipt.amount,
    currency: receipt.currency,
    issuedAt: receipt.issuedAt,
    notes: receipt.notes,
  });

  return exportResponse(buffer, `${receipt.number}.${format}`, format);
}
