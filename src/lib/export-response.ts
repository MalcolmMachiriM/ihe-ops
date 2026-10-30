import { NextResponse } from "next/server";
import type { ExportFormat } from "@/lib/export-types";

const mime: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export function exportResponse(buffer: Buffer, filename: string, format: ExportFormat) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime[format],
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export function pdfResponse(buffer: Buffer, filename: string) {
  return exportResponse(buffer, filename, "pdf");
}

export { companyName } from "@/lib/brand";
