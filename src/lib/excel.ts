import ExcelJS from "exceljs";
import { brand } from "@/lib/brand";
import type {
  InvoiceExportInput,
  PurchaseOrderExportInput,
  QuoteExportInput,
  ReceiptExportInput,
  ReportExportInput,
  StatementExportInput,
} from "@/lib/export-types";
import { formatDate, formatMoney, num } from "@/lib/format";

async function workbookWithBrand(sheetName: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = brand.company;
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: false }],
  });

  sheet.getColumn(1).width = 36;
  sheet.getColumn(2).width = 16;
  sheet.getColumn(3).width = 16;
  sheet.getColumn(4).width = 16;
  sheet.getColumn(5).width = 16;
  sheet.getColumn(6).width = 16;

  sheet.getCell("A1").value = brand.company;
  sheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF0F172A" } };
  sheet.getCell("A2").value = brand.address;
  sheet.getCell("A3").value = brand.phones.join(" · ");
  sheet.getCell("A4").value = brand.email;
  sheet.getCell("A5").value = brand.tagline;
  sheet.getCell("A5").font = { italic: true, color: { argb: "FF7C3AED" } };

  return { workbook, sheet, startRow: 8 };
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" },
  };
}

export async function quoteXlsx(input: QuoteExportInput) {
  const { workbook, sheet, startRow } = await workbookWithBrand(input.number);
  sheet.getCell(`A${startRow}`).value = input.number;
  sheet.getCell(`A${startRow}`).font = { bold: true, size: 14 };
  sheet.getCell(`A${startRow + 1}`).value =
    `${input.customerName} · valid until ${formatDate(input.validUntil)}`;

  const header = sheet.getRow(startRow + 3);
  header.values = ["Item", "Qty", "Unit", "Price", "Amount"];
  styleHeader(header);

  let rowIndex = startRow + 4;
  for (const line of input.lines) {
    const amount = num(line.quantity) * num(line.unitPrice);
    const row = sheet.getRow(rowIndex);
    row.values = [
      line.brand ? `${line.description} (${line.brand})` : line.description,
      num(line.quantity),
      line.unit,
      num(line.unitPrice),
      amount,
    ];
    rowIndex += 1;
  }

  sheet.getCell(`D${rowIndex + 1}`).value = "Total";
  sheet.getCell(`D${rowIndex + 1}`).font = { bold: true };
  sheet.getCell(`E${rowIndex + 1}`).value = num(input.total);
  sheet.getCell(`E${rowIndex + 1}`).font = { bold: true };
  if (input.notes) sheet.getCell(`A${rowIndex + 3}`).value = `Notes: ${input.notes}`;
  if (input.terms) sheet.getCell(`A${rowIndex + 4}`).value = `Terms: ${input.terms}`;

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function invoiceXlsx(input: InvoiceExportInput) {
  const { workbook, sheet, startRow } = await workbookWithBrand(input.number);
  const balance = num(input.total) - num(input.amountPaid) - num(input.credited ?? 0);
  sheet.getCell(`A${startRow}`).value = input.number;
  sheet.getCell(`A${startRow}`).font = { bold: true, size: 14 };
  sheet.getCell(`A${startRow + 1}`).value =
    `${input.customerName} · ${input.status} · due ${formatDate(input.dueDate)}`;

  const header = sheet.getRow(startRow + 3);
  header.values = ["Item", "Qty", "Unit", "Price", "Amount"];
  styleHeader(header);

  let rowIndex = startRow + 4;
  for (const line of input.lines) {
    const amount = num(line.quantity) * num(line.unitPrice);
    sheet.getRow(rowIndex).values = [
      line.brand ? `${line.description} (${line.brand})` : line.description,
      num(line.quantity),
      line.unit,
      num(line.unitPrice),
      amount,
    ];
    rowIndex += 1;
  }

  sheet.getCell(`D${rowIndex + 1}`).value = "Total";
  sheet.getCell(`E${rowIndex + 1}`).value = num(input.total);
  sheet.getCell(`D${rowIndex + 2}`).value = "Paid";
  sheet.getCell(`E${rowIndex + 2}`).value = num(input.amountPaid);
  sheet.getCell(`D${rowIndex + 3}`).value = "Credits";
  sheet.getCell(`E${rowIndex + 3}`).value = num(input.credited ?? 0);
  sheet.getCell(`D${rowIndex + 4}`).value = "Balance";
  sheet.getCell(`D${rowIndex + 4}`).font = { bold: true };
  sheet.getCell(`E${rowIndex + 4}`).value = balance;
  sheet.getCell(`E${rowIndex + 4}`).font = { bold: true };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function receiptXlsx(input: ReceiptExportInput) {
  const { workbook, sheet, startRow } = await workbookWithBrand(input.number);
  sheet.getCell(`A${startRow}`).value = input.number;
  sheet.getCell(`A${startRow}`).font = { bold: true, size: 14 };
  const rows = [
    ["Customer", input.customerName],
    ["Issued", formatDate(input.issuedAt)],
    ["Invoice", input.invoiceNumber],
    ["Method", input.method.replace(/_/g, " ")],
    ["Amount", formatMoney(input.amount, input.currency)],
  ];
  rows.forEach(([label, value], index) => {
    sheet.getCell(`A${startRow + 2 + index}`).value = label;
    sheet.getCell(`A${startRow + 2 + index}`).font = { bold: true };
    sheet.getCell(`B${startRow + 2 + index}`).value = value;
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function purchaseOrderXlsx(input: PurchaseOrderExportInput) {
  const { workbook, sheet, startRow } = await workbookWithBrand(input.number);
  sheet.getCell(`A${startRow}`).value = input.number;
  sheet.getCell(`A${startRow}`).font = { bold: true, size: 14 };
  sheet.getCell(`A${startRow + 1}`).value =
    `${input.supplierName} · ${input.quoteNumber} · ${input.status}`;

  const header = sheet.getRow(startRow + 3);
  header.values = ["Item", "Qty", "Unit", "Cost", "Amount", "Lead (days)"];
  styleHeader(header);

  let rowIndex = startRow + 4;
  for (const line of input.lines) {
    const amount = num(line.quantity) * num(line.unitPrice);
    sheet.getRow(rowIndex).values = [
      line.brand ? `${line.description} (${line.brand})` : line.description,
      num(line.quantity),
      line.unit,
      num(line.unitPrice),
      amount,
      line.leadTimeDays ?? "",
    ];
    rowIndex += 1;
  }
  if (input.notes) sheet.getCell(`A${rowIndex + 1}`).value = `Notes: ${input.notes}`;
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function statementXlsx(input: StatementExportInput) {
  const { workbook, sheet, startRow } = await workbookWithBrand("Statement");
  sheet.getCell(`A${startRow}`).value = "Customer statement";
  sheet.getCell(`A${startRow}`).font = { bold: true, size: 14 };
  sheet.getCell(`A${startRow + 1}`).value = input.customerName;

  const header = sheet.getRow(startRow + 3);
  header.values = ["Date", "Item", "Currency", "Debit", "Credit", "Balance"];
  styleHeader(header);

  let rowIndex = startRow + 4;
  for (const row of input.rows) {
    sheet.getRow(rowIndex).values = [
      formatDate(row.date),
      row.label,
      row.currency,
      row.debit || "",
      row.credit || "",
      row.balance,
    ];
    rowIndex += 1;
  }

  input.balances.forEach(([currency, amount], index) => {
    sheet.getCell(`A${rowIndex + 2 + index}`).value = `Balance ${currency}`;
    sheet.getCell(`A${rowIndex + 2 + index}`).font = { bold: true };
    sheet.getCell(`B${rowIndex + 2 + index}`).value = amount;
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function reportXlsx(input: ReportExportInput) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = brand.company;

  const addSheet = (
    name: string,
    headers: string[],
    rows: (string | number)[][],
  ) => {
    const sheet = workbook.addWorksheet(name);
    styleHeader(sheet.getRow(1));
    sheet.getRow(1).values = headers;
    rows.forEach((values, index) => {
      sheet.getRow(index + 2).values = values;
    });
    headers.forEach((_, index) => {
      sheet.getColumn(index + 1).width = 18;
    });
  };

  addSheet(
    "Pipeline",
    ["Status", "Currency", "Quotes", "Amount"],
    input.pipeline.map((row) => [row.status, row.currency, row.count, row.amount]),
  );
  addSheet(
    "Margin by quote",
    ["Quote", "Currency", "Cost", "Sell", "Margin"],
    input.byQuote.map((row) => [row.label, row.currency, row.cost, row.sell, row.sell - row.cost]),
  );
  addSheet(
    "Margin by category",
    ["Category", "Currency", "Cost", "Sell", "Margin"],
    input.byCategory.map((row) => [row.label, row.currency, row.cost, row.sell, row.sell - row.cost]),
  );
  addSheet(
    "Margin by salesperson",
    ["Salesperson", "Currency", "Cost", "Sell", "Margin"],
    input.bySalesperson.map((row) => [
      row.label,
      row.currency,
      row.cost,
      row.sell,
      row.sell - row.cost,
    ]),
  );
  addSheet(
    "Ageing",
    ["Currency", "Current", "1-30", "31-60", "61-90", "90+"],
    input.ageing.map((row) => [
      row.currency,
      row.current,
      row.d30,
      row.d60,
      row.d90,
      row.older,
    ]),
  );

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
