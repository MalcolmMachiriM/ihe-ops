import { notFound } from "next/navigation";
import { getReceipt } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { exportReceipt } from "@/lib/document-export";
import { pdfResponse } from "@/lib/pdf-response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireUser();
  const { id } = await context.params;
  const receipt = await getReceipt(id);
  if (!receipt) notFound();

  const buffer = await exportReceipt("pdf", {
    number: receipt.number,
    customerName: receipt.customerName,
    invoiceNumber: receipt.invoiceNumber,
    method: receipt.method,
    amount: receipt.amount,
    currency: receipt.currency,
    issuedAt: receipt.issuedAt,
    notes: receipt.notes,
  });

  return pdfResponse(buffer, `${receipt.number}.pdf`);
}
