export type ExportLine = {
  description: string;
  brand?: string | null;
  quantity: string | number;
  unit: string;
  unitPrice: string | number;
  leadTimeDays?: number | null;
};

export type QuoteExportInput = {
  number: string;
  customerName: string;
  validUntil: Date | string | null;
  currency: string;
  total: string | number;
  notes?: string | null;
  terms?: string | null;
  lines: ExportLine[];
};

export type InvoiceExportInput = {
  number: string;
  customerName: string;
  status: string;
  dueDate: Date | string | null;
  currency: string;
  total: string | number;
  amountPaid: string | number;
  credited?: string | number;
  notes?: string | null;
  lines: ExportLine[];
};

export type ReceiptExportInput = {
  number: string;
  customerName: string;
  invoiceNumber: string;
  method: string;
  amount: string | number;
  currency: string;
  issuedAt: Date | string;
  notes?: string | null;
};

export type PurchaseOrderExportInput = {
  number: string;
  supplierName: string;
  quoteNumber: string;
  status: string;
  currency: string;
  notes?: string | null;
  lines: ExportLine[];
};

export type StatementExportInput = {
  customerName: string;
  rows: {
    date: Date | string;
    label: string;
    currency: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  balances: [string, number][];
};

export type ReportExportInput = {
  pipeline: { status: string; currency: string; count: number; amount: number }[];
  byQuote: { label: string; currency: string; cost: number; sell: number }[];
  byCategory: { label: string; currency: string; cost: number; sell: number }[];
  bySalesperson: { label: string; currency: string; cost: number; sell: number }[];
  ageing: {
    currency: string;
    current: number;
    d30: number;
    d60: number;
    d90: number;
    older: number;
  }[];
};

export type ExportFormat = "pdf" | "docx" | "xlsx";

export function isExportFormat(value: string): value is ExportFormat {
  return value === "pdf" || value === "docx" || value === "xlsx";
}
