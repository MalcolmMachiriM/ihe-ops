import { notFound } from "next/navigation";
import { getShare } from "@/db/queries";
import { pdfResponse } from "@/lib/pdf-response";
import { buildSharePdf, type ShareKind } from "@/lib/share-pdf";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const share = await getShare(token);
  if (!share) notFound();

  const kind = share.kind as ShareKind;
  if (kind !== "quote" && kind !== "invoice" && kind !== "receipt") notFound();

  const pdf = await buildSharePdf(kind, share.documentId);
  if (!pdf) notFound();

  return pdfResponse(pdf.buffer, pdf.filename, "inline");
}
