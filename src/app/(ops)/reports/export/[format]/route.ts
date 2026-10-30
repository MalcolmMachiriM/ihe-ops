import { notFound } from "next/navigation";
import { getOperationsReport } from "@/db/reports";
import { requireUser } from "@/lib/auth";
import { exportReport } from "@/lib/document-export";
import { exportResponse } from "@/lib/export-response";
import { isExportFormat } from "@/lib/export-types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ format: string }> },
) {
  await requireUser();
  const { format } = await context.params;
  if (!isExportFormat(format)) notFound();

  const report = await getOperationsReport();
  const buffer = await exportReport(format, report);
  return exportResponse(buffer, `operations_report.${format}`, format);
}
