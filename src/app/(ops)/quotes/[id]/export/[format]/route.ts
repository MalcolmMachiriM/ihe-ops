import { notFound } from "next/navigation";
import { getQuote } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { exportQuote, mapSellLines } from "@/lib/document-export";
import { exportResponse } from "@/lib/export-response";
import { isExportFormat } from "@/lib/export-types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; format: string }> },
) {
  await requireUser();
  const { id, format } = await context.params;
  if (!isExportFormat(format)) notFound();

  const quote = await getQuote(id);
  if (!quote) notFound();

  const buffer = await exportQuote(format, {
    number: quote.number,
    customerName: quote.customerName,
    validUntil: quote.validUntil,
    currency: quote.currency,
    total: quote.total,
    notes: quote.notes,
    terms: quote.terms,
    lines: mapSellLines(quote.lines),
  });

  return exportResponse(buffer, `${quote.number}.${format}`, format);
}
