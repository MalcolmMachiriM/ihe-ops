import { and, eq } from "drizzle-orm";
import { get } from "@vercel/blob";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { supplierRfqFiles, supplierRfqs } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; fileId: string }> },
) {
  await requireUser();
  const { id, fileId } = await context.params;
  const [file] = await getDb()
    .select({
      fileName: supplierRfqFiles.fileName,
      url: supplierRfqFiles.url,
      contentType: supplierRfqFiles.contentType,
    })
    .from(supplierRfqFiles)
    .innerJoin(supplierRfqs, eq(supplierRfqFiles.rfqId, supplierRfqs.id))
    .where(and(eq(supplierRfqFiles.id, fileId), eq(supplierRfqs.enquiryId, id)));
  if (!file) notFound();

  const blob = await get(file.url, { access: "private" });
  if (!blob) notFound();

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": file.contentType ?? blob.blob.contentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
    },
  });
}
