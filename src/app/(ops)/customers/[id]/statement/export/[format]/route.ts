import { notFound } from "next/navigation";
import { getCustomerStatement } from "@/db/reports";
import { requireUser } from "@/lib/auth";
import { exportStatement } from "@/lib/document-export";
import { exportResponse } from "@/lib/export-response";
import { isExportFormat } from "@/lib/export-types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; format: string }> },
) {
  await requireUser();
  const { id, format } = await context.params;
  if (!isExportFormat(format)) notFound();

  const statement = await getCustomerStatement(id);
  if (!statement) notFound();

  const buffer = await exportStatement(format, {
    customerName: statement.customer.name,
    rows: statement.rows,
    balances: statement.balances,
  });

  const slug = statement.customer.name.replace(/[^\w.-]+/g, "_");
  return exportResponse(buffer, `${slug}_statement.${format}`, format);
}
