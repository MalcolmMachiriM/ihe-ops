import { NextResponse } from "next/server";
import type { ExportFormat } from "@/lib/export-types";

const mime: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export function exportResponse(
  buffer: Buffer,
  filename: string,
  format: ExportFormat,
  disposition: "attachment" | "inline" = "attachment",
) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime[format],
      "Content-Disposition": `${disposition}; filename="${filename}"`,
    },
  });
}

export function pdfResponse(
  buffer: Buffer,
  filename: string,
  disposition: "attachment" | "inline" = "attachment",
) {
  return exportResponse(buffer, filename, "pdf", disposition);
}

export { companyName } from "@/lib/brand";
