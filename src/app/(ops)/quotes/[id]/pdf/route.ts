import { notFound } from "next/navigation";
import { getQuote } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { exportQuote, mapSellLines } from "@/lib/document-export";
import { pdfResponse } from "@/lib/pdf-response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireUser();
  const { id } = await context.params;
  const quote = await getQuote(id);
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
