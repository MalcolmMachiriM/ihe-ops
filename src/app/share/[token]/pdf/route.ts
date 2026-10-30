import { notFound } from "next/navigation";
import { getInvoice, getQuote, getReceipt, getShare } from "@/db/queries";
import { exportInvoice, exportQuote, exportReceipt, mapSellLines } from "@/lib/document-export";
import { pdfResponse } from "@/lib/pdf-response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const share = await getShare(token);
  if (!share) notFound();

  if (share.kind === "quote") {
    const quote = await getQuote(share.documentId);
    if (!quote) notFound();
    const buffer = await exportQuote("pdf", {
      number: quote.number,
      customerName: quote.customerName,
      validUntil: quote.validUntil,
      currency: quote.currency,
      total: quote.total,
      notes: quote.notes,
      terms: quote.terms,
      lines: mapSellLines(quote.lines),
    });
    return pdfResponse(buffer, `${quote.number}.pdf`);
  }

  if (share.kind === "invoice") {
    const invoice = await getInvoice(share.documentId);
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

  const receipt = await getReceipt(share.documentId);
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
