import { notFound } from "next/navigation";
import { getQuote } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { quotePdf } from "@/lib/pdf";
import { companyName, pdfResponse } from "@/lib/pdf-response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireUser();
  const { id } = await context.params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const buffer = await quotePdf({
    company: companyName(),
    number: quote.number,
    customerName: quote.customerName,
    validUntil: quote.validUntil,
    currency: quote.currency,
    total: quote.total,
    lines: quote.lines,
  });

  return pdfResponse(buffer, `${quote.number}.pdf`);
}
