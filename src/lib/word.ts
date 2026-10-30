import JSZip from "jszip";
import { letterheadDocxBuffer } from "@/lib/brand";
import type {
  InvoiceExportInput,
  PurchaseOrderExportInput,
  QuoteExportInput,
  ReceiptExportInput,
  ReportExportInput,
  StatementExportInput,
} from "@/lib/export-types";
import { formatDate, formatMoney, num } from "@/lib/format";

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function para(text: string, opts?: { bold?: boolean; size?: number; after?: number }) {
  const size = opts?.size ?? 20;
  const after = opts?.after ?? 80;
  const bold = opts?.bold ? "<w:b/>" : "";
  return `<w:p><w:pPr><w:spacing w:after="${after}"/><w:rPr>${bold}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:color w:val="0F172A"/><w:lang w:val="en-ZW"/></w:rPr></w:pPr><w:r><w:rPr>${bold}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:color w:val="0F172A"/><w:lang w:val="en-ZW"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function muted(text: string) {
  return `<w:p><w:pPr><w:spacing w:after="60"/><w:rPr><w:sz w:val="18"/><w:color w:val="475569"/><w:lang w:val="en-ZW"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="475569"/><w:lang w:val="en-ZW"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function cell(text: string, width: number, opts?: { bold?: boolean; align?: "left" | "right" }) {
  const bold = opts?.bold ? "<w:b/>" : "";
  const align = opts?.align === "right" ? "<w:jc w:val=\"right\"/>" : "";
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="CBD5E1"/><w:left w:val="single" w:sz="4" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="4" w:color="CBD5E1"/><w:right w:val="single" w:sz="4" w:color="CBD5E1"/></w:tcBorders></w:tcPr><w:p><w:pPr>${align}<w:spacing w:after="0"/><w:rPr>${bold}<w:sz w:val="18"/><w:color w:val="0F172A"/></w:rPr></w:pPr><w:r><w:rPr>${bold}<w:sz w:val="18"/><w:color w:val="0F172A"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p></w:tc>`;
}

function table(headers: string[], rows: string[][], widths: number[]) {
  const headerRow = `<w:tr>${headers.map((header, i) => cell(header, widths[i] ?? 1500, { bold: true })).join("")}</w:tr>`;
  const body = rows
    .map(
      (row) =>
        `<w:tr>${row
          .map((value, i) =>
            cell(value, widths[i] ?? 1500, {
              align: i === 0 ? "left" : "right",
            }),
          )
          .join("")}</w:tr>`,
    )
    .join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="CBD5E1"/><w:left w:val="single" w:sz="4" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="4" w:color="CBD5E1"/><w:right w:val="single" w:sz="4" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="4" w:color="CBD5E1"/><w:insideV w:val="single" w:sz="4" w:color="CBD5E1"/></w:tblBorders></w:tblPr><w:tblGrid>${widths.map((width) => `<w:gridCol w:w="${width}"/>`).join("")}</w:tblGrid>${headerRow}${body}</w:tbl>`;
}

async function renderOnLetterhead(bodyXml: string) {
  const zip = await JSZip.loadAsync(await letterheadDocxBuffer());
  const path = "word/document.xml";
  const current = await zip.file(path)!.async("string");
  const next = current.replace(
    /<w:body>[\s\S]*?<w:sectPr>/,
    `<w:body>${bodyXml}<w:sectPr>`,
  );
  zip.file(path, next);
  return zip.generateAsync({ type: "nodebuffer" });
}

function lineRows(
  lines: { description: string; brand?: string | null; quantity: string | number; unit: string; unitPrice: string | number }[],
  currency: string,
) {
  return lines.map((line) => {
    const amount = num(line.quantity) * num(line.unitPrice);
    const label = line.brand ? `${line.description} (${line.brand})` : line.description;
    return [
      label,
      `${num(line.quantity)} ${line.unit}`,
      formatMoney(line.unitPrice, currency),
      formatMoney(amount, currency),
    ];
  });
}

const lineWidths = [4200, 1400, 1600, 1600];

export async function quoteDocx(input: QuoteExportInput) {
  const body = [
    para(input.number, { bold: true, size: 28, after: 40 }),
    muted(`${input.customerName} · valid until ${formatDate(input.validUntil)}`),
    table(["Item", "Qty", "Price", "Amount"], lineRows(input.lines, input.currency), lineWidths),
    para(`Total ${formatMoney(input.total, input.currency)}`, { bold: true, size: 22, after: 120 }),
    input.notes ? muted(`Notes: ${input.notes}`) : "",
    input.terms ? muted(`Terms: ${input.terms}`) : "",
  ].join("");
  return renderOnLetterhead(body);
}

export async function invoiceDocx(input: InvoiceExportInput) {
  const balance = num(input.total) - num(input.amountPaid) - num(input.credited ?? 0);
  const body = [
    para(input.number, { bold: true, size: 28, after: 40 }),
    muted(`${input.customerName} · ${input.status} · due ${formatDate(input.dueDate)}`),
    table(["Item", "Qty", "Price", "Amount"], lineRows(input.lines, input.currency), lineWidths),
    para(`Total ${formatMoney(input.total, input.currency)}`, { bold: true, after: 40 }),
    para(`Paid ${formatMoney(input.amountPaid, input.currency)}`),
    para(`Credits ${formatMoney(input.credited ?? 0, input.currency)}`),
    para(`Balance ${formatMoney(balance, input.currency)}`, { bold: true, size: 22 }),
    input.notes ? muted(`Notes: ${input.notes}`) : "",
  ].join("");
  return renderOnLetterhead(body);
}

export async function receiptDocx(input: ReceiptExportInput) {
  const body = [
    para(input.number, { bold: true, size: 28, after: 40 }),
    muted(`${input.customerName} · ${formatDate(input.issuedAt)}`),
    para(`Invoice ${input.invoiceNumber}`),
    para(`Method ${input.method.replace(/_/g, " ")}`),
    para(`Amount ${formatMoney(input.amount, input.currency)}`, { bold: true, size: 22 }),
    input.notes ? muted(`Notes: ${input.notes}`) : "",
  ].join("");
  return renderOnLetterhead(body);
}

export async function purchaseOrderDocx(input: PurchaseOrderExportInput) {
  const body = [
    para(input.number, { bold: true, size: 28, after: 40 }),
    muted(`${input.supplierName} · ${input.quoteNumber} · ${input.status}`),
    table(
      ["Item", "Qty", "Cost", "Amount"],
      lineRows(input.lines, input.currency),
      lineWidths,
    ),
    input.notes ? muted(`Notes: ${input.notes}`) : "",
  ].join("");
  return renderOnLetterhead(body);
}

export async function statementDocx(input: StatementExportInput) {
  const rows = input.rows.map((row) => [
    formatDate(row.date),
    row.label,
    row.debit ? formatMoney(row.debit, row.currency) : "—",
    row.credit ? formatMoney(row.credit, row.currency) : "—",
    formatMoney(row.balance, row.currency),
  ]);
  const body = [
    para("Customer statement", { bold: true, size: 28, after: 40 }),
    muted(input.customerName),
    table(["Date", "Item", "Debit", "Credit", "Balance"], rows, [1400, 2800, 1400, 1400, 1600]),
    ...input.balances.map(([currency, amount]) =>
      para(`Balance ${currency}: ${formatMoney(amount, currency)}`, { bold: true }),
    ),
  ].join("");
  return renderOnLetterhead(body);
}

export async function reportDocx(input: ReportExportInput) {
  const marginTable = (
    title: string,
    rows: { label: string; currency: string; cost: number; sell: number }[],
  ) =>
    [
      para(title, { bold: true, size: 22, after: 60 }),
      table(
        ["Label", "Currency", "Cost", "Sell", "Margin"],
        rows.map((row) => [
          row.label,
          row.currency,
          formatMoney(row.cost, row.currency),
          formatMoney(row.sell, row.currency),
          formatMoney(row.sell - row.cost, row.currency),
        ]),
        [2600, 1200, 1400, 1400, 1400],
      ),
    ].join("");

  const body = [
    para("Operations report", { bold: true, size: 28, after: 40 }),
    muted("Pipeline, margin, and receivables ageing"),
    para("Pipeline", { bold: true, size: 22, after: 60 }),
    table(
      ["Status", "Currency", "Quotes", "Amount"],
      input.pipeline.map((row) => [
        row.status,
        row.currency,
        String(row.count),
        formatMoney(row.amount, row.currency),
      ]),
      [2600, 1400, 1400, 2400],
    ),
    marginTable("Margin by quote", input.byQuote),
    marginTable("Margin by category", input.byCategory),
    marginTable("Margin by salesperson", input.bySalesperson),
    para("Receivables ageing", { bold: true, size: 22, after: 60 }),
    table(
      ["Currency", "Current", "1–30", "31–60", "61–90", "90+"],
      input.ageing.map((row) => [
        row.currency,
        formatMoney(row.current, row.currency),
        formatMoney(row.d30, row.currency),
        formatMoney(row.d60, row.currency),
        formatMoney(row.d90, row.currency),
        formatMoney(row.older, row.currency),
      ]),
      [1200, 1400, 1400, 1400, 1400, 1400],
    ),
  ].join("");
  return renderOnLetterhead(body);
}
