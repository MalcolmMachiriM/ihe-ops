import {
  invoicePdf,
  purchaseOrderPdf,
  quotePdf,
  receiptPdf,
  reportPdf,
  statementPdf,
} from "@/lib/pdf";
import {
  invoiceXlsx,
  purchaseOrderXlsx,
  quoteXlsx,
  receiptXlsx,
  reportXlsx,
  statementXlsx,
} from "@/lib/excel";
import type {
  ExportFormat,
  InvoiceExportInput,
  PurchaseOrderExportInput,
  QuoteExportInput,
  ReceiptExportInput,
  ReportExportInput,
  StatementExportInput,
} from "@/lib/export-types";
import {
  invoiceDocx,
  purchaseOrderDocx,
  quoteDocx,
  receiptDocx,
  reportDocx,
  statementDocx,
} from "@/lib/word";

export function mapSellLines(
  lines: {
    description: string;
    brand?: string | null;
    quantity: string | number;
    unit: string;
    sellPrice: string | number;
    leadTimeDays?: number | null;
  }[],
): QuoteExportInput["lines"] {
  return lines.map((line) => ({
    description: line.description,
    brand: line.brand,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.sellPrice,
    leadTimeDays: line.leadTimeDays,
  }));
}

export function mapCostLines(
  lines: {
    description: string;
    brand?: string | null;
    quantity: string | number;
    unit: string;
    costPrice: string | number;
    leadTimeDays?: number | null;
  }[],
): PurchaseOrderExportInput["lines"] {
  return lines.map((line) => ({
    description: line.description,
    brand: line.brand,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.costPrice,
    leadTimeDays: line.leadTimeDays,
  }));
}

export async function exportQuote(format: ExportFormat, input: QuoteExportInput) {
  if (format === "pdf") return quotePdf(input);
  if (format === "docx") return quoteDocx(input);
  return quoteXlsx(input);
}

export async function exportInvoice(format: ExportFormat, input: InvoiceExportInput) {
  if (format === "pdf") return invoicePdf(input);
  if (format === "docx") return invoiceDocx(input);
  return invoiceXlsx(input);
}

export async function exportReceipt(format: ExportFormat, input: ReceiptExportInput) {
  if (format === "pdf") return receiptPdf(input);
  if (format === "docx") return receiptDocx(input);
  return receiptXlsx(input);
}

export async function exportPurchaseOrder(
  format: ExportFormat,
  input: PurchaseOrderExportInput,
) {
  if (format === "pdf") return purchaseOrderPdf(input);
  if (format === "docx") return purchaseOrderDocx(input);
  return purchaseOrderXlsx(input);
}

export async function exportStatement(format: ExportFormat, input: StatementExportInput) {
  if (format === "pdf") return statementPdf(input);
  if (format === "docx") return statementDocx(input);
  return statementXlsx(input);
}

export async function exportReport(format: ExportFormat, input: ReportExportInput) {
  if (format === "pdf") return reportPdf(input);
  if (format === "docx") return reportDocx(input);
  return reportXlsx(input);
}
