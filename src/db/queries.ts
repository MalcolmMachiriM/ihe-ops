import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  customers,
  enquiries,
  invoiceLines,
  invoices,
  payments,
  quoteLines,
  quotes,
  receipts,
  suppliers,
} from "@/db/schema";
import { num } from "@/lib/format";

export async function listCustomers() {
  return getDb().select().from(customers).orderBy(desc(customers.createdAt));
}

export async function getCustomer(id: string) {
  const [customer] = await getDb()
    .select()
    .from(customers)
    .where(eq(customers.id, id));
  return customer ?? null;
}

export async function listSuppliers() {
  return getDb().select().from(suppliers).orderBy(desc(suppliers.createdAt));
}

export async function getSupplier(id: string) {
  const [supplier] = await getDb()
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, id));
  return supplier ?? null;
}

export async function listEnquiries() {
  return getDb()
    .select({
      id: enquiries.id,
      reference: enquiries.reference,
      title: enquiries.title,
      description: enquiries.description,
      customerId: enquiries.customerId,
      customerName: customers.name,
      status: enquiries.status,
      urgency: enquiries.urgency,
      source: enquiries.source,
      neededBy: enquiries.neededBy,
      assignedTo: enquiries.assignedTo,
      createdAt: enquiries.createdAt,
    })
    .from(enquiries)
    .innerJoin(customers, eq(enquiries.customerId, customers.id))
    .orderBy(desc(enquiries.createdAt));
}

export async function getEnquiry(id: string) {
  const [enquiry] = await getDb()
    .select()
    .from(enquiries)
    .where(eq(enquiries.id, id));
  return enquiry ?? null;
}

export async function listQuotes() {
  const db = getDb();
  const quoteRows = await db
    .select({
      id: quotes.id,
      number: quotes.number,
      enquiryId: quotes.enquiryId,
      customerId: quotes.customerId,
      customerName: customers.name,
      status: quotes.status,
      currency: quotes.currency,
      subtotal: quotes.subtotal,
      taxTotal: quotes.taxTotal,
      total: quotes.total,
      validUntil: quotes.validUntil,
      notes: quotes.notes,
      terms: quotes.terms,
      version: quotes.version,
      createdAt: quotes.createdAt,
    })
    .from(quotes)
    .innerJoin(customers, eq(quotes.customerId, customers.id))
    .orderBy(desc(quotes.createdAt));

  const lines = await db
    .select({
      id: quoteLines.id,
      quoteId: quoteLines.quoteId,
      description: quoteLines.description,
      brand: quoteLines.brand,
      quantity: quoteLines.quantity,
      unit: quoteLines.unit,
      costPrice: quoteLines.costPrice,
      sellPrice: quoteLines.sellPrice,
      supplierId: quoteLines.supplierId,
      supplierName: suppliers.name,
      leadTimeDays: quoteLines.leadTimeDays,
      sortOrder: quoteLines.sortOrder,
    })
    .from(quoteLines)
    .leftJoin(suppliers, eq(quoteLines.supplierId, suppliers.id))
    .orderBy(quoteLines.sortOrder);

  return quoteRows.map((quote) => ({
    ...quote,
    lines: lines.filter((line) => line.quoteId === quote.id),
  }));
}

export async function getQuote(id: string) {
  const quotesForId = await listQuotes();
  return quotesForId.find((quote) => quote.id === id) ?? null;
}

export async function listInvoices() {
  return getDb()
    .select({
      id: invoices.id,
      number: invoices.number,
      quoteId: invoices.quoteId,
      quoteNumber: quotes.number,
      customerId: invoices.customerId,
      customerName: customers.name,
      status: invoices.status,
      currency: invoices.currency,
      subtotal: invoices.subtotal,
      taxTotal: invoices.taxTotal,
      total: invoices.total,
      amountPaid: invoices.amountPaid,
      dueDate: invoices.dueDate,
      notes: invoices.notes,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(quotes, eq(invoices.quoteId, quotes.id))
    .orderBy(desc(invoices.createdAt));
}

export async function getInvoice(id: string) {
  const db = getDb();
  const [invoice] = await listInvoices().then((rows) =>
    rows.filter((row) => row.id === id),
  );
  if (!invoice) return null;

  const lines = await db
    .select({
      id: invoiceLines.id,
      description: invoiceLines.description,
      brand: invoiceLines.brand,
      quantity: invoiceLines.quantity,
      unit: invoiceLines.unit,
      costPrice: invoiceLines.costPrice,
      sellPrice: invoiceLines.sellPrice,
      supplierId: invoiceLines.supplierId,
      supplierName: suppliers.name,
      leadTimeDays: invoiceLines.leadTimeDays,
      sortOrder: invoiceLines.sortOrder,
    })
    .from(invoiceLines)
    .leftJoin(suppliers, eq(invoiceLines.supplierId, suppliers.id))
    .where(eq(invoiceLines.invoiceId, id))
    .orderBy(invoiceLines.sortOrder);

  const paymentRows = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      reference: payments.reference,
      paidAt: payments.paidAt,
      receiptId: receipts.id,
      receiptNumber: receipts.number,
    })
    .from(payments)
    .leftJoin(receipts, eq(receipts.paymentId, payments.id))
    .where(eq(payments.invoiceId, id))
    .orderBy(desc(payments.paidAt));

  return {
    ...invoice,
    balance: num(invoice.total) - num(invoice.amountPaid),
    lines,
    payments: paymentRows,
  };
}

export async function listReceipts() {
  return getDb()
    .select({
      id: receipts.id,
      number: receipts.number,
      customerId: receipts.customerId,
      customerName: customers.name,
      amount: receipts.amount,
      currency: receipts.currency,
      issuedAt: receipts.issuedAt,
      notes: receipts.notes,
      method: payments.method,
      invoiceId: invoices.id,
      invoiceNumber: invoices.number,
      quoteId: invoices.quoteId,
    })
    .from(receipts)
    .innerJoin(customers, eq(receipts.customerId, customers.id))
    .innerJoin(payments, eq(receipts.paymentId, payments.id))
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .orderBy(desc(receipts.issuedAt));
}

export async function getReceipt(id: string) {
  const rows = await listReceipts();
  return rows.find((receipt) => receipt.id === id) ?? null;
}

export async function getDashboard() {
  const [enquiryRows, quoteRows, invoiceRows] = await Promise.all([
    listEnquiries(),
    listQuotes(),
    listInvoices(),
  ]);

  const openEnquiries = enquiryRows.filter((enquiry) =>
    ["new", "sourcing", "quoted"].includes(enquiry.status),
  ).length;
  const openQuotes = quoteRows.filter((quote) =>
    ["draft", "sent"].includes(quote.status),
  ).length;
  const quotePipeline = quoteRows
    .filter((quote) => ["draft", "sent"].includes(quote.status))
    .reduce((sum, quote) => sum + num(quote.total), 0);
  const receivables = invoiceRows.reduce(
    (sum, invoice) => sum + Math.max(num(invoice.total) - num(invoice.amountPaid), 0),
    0,
  );

  return {
    openEnquiries,
    openQuotes,
    quotePipeline,
    receivables,
    enquiries: enquiryRows.slice(0, 5),
    quotes: quoteRows.slice(0, 5),
    invoices: invoiceRows.slice(0, 5),
  };
}
