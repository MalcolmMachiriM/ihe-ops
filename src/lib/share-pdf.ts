import { getInvoice, getQuote, getReceipt } from "@/db/queries";
import { exportInvoice, exportQuote, exportReceipt, mapSellLines } from "@/lib/document-export";

export type ShareKind = "quote" | "invoice" | "receipt";

export async function buildSharePdf(
  kind: ShareKind,
  documentId: string,
): Promise<{ filename: string; buffer: Buffer } | null> {
  if (kind === "quote") {
    const quote = await getQuote(documentId);
    if (!quote) return null;
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
    return { filename: `${quote.number}.pdf`, buffer };
  }

  if (kind === "invoice") {
    const invoice = await getInvoice(documentId);
    if (!invoice) return null;
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
    return { filename: `${invoice.number}.pdf`, buffer };
  }

  const receipt = await getReceipt(documentId);
  if (!receipt) return null;
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
  return { filename: `${receipt.number}.pdf`, buffer };
}
