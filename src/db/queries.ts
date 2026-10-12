import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  customers,
  enquiries,
  invoiceLines,
  invoices,
  payments,
  purchaseOrderLines,
  purchaseOrders,
  quoteLines,
  quotes,
  receipts,
  sourcingItems,
  supplierOffers,
  supplierRfqFiles,
  supplierRfqs,
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
  const db = getDb();
  const rows = await db
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

  const quoteRows = await db
    .select({ enquiryId: quotes.enquiryId, createdAt: quotes.createdAt })
    .from(quotes);
  const firstQuotedAt = new Map<string, Date>();
  for (const quote of quoteRows) {
    if (!quote.enquiryId) continue;
    const existing = firstQuotedAt.get(quote.enquiryId);
    if (!existing || quote.createdAt < existing) {
      firstQuotedAt.set(quote.enquiryId, quote.createdAt);
    }
  }

  return rows.map((row) => ({
    ...row,
    firstQuotedAt: firstQuotedAt.get(row.id) ?? null,
  }));
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
      offerId: quoteLines.offerId,
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

export async function getSourcing(enquiryId: string) {
  const db = getDb();
  const items = await db
    .select()
    .from(sourcingItems)
    .where(eq(sourcingItems.enquiryId, enquiryId))
    .orderBy(asc(sourcingItems.sortOrder));

  const offers = items.length
    ? await db
        .select({
          id: supplierOffers.id,
          sourcingItemId: supplierOffers.sourcingItemId,
          supplierId: supplierOffers.supplierId,
          supplierName: suppliers.name,
          brand: supplierOffers.brand,
          costPrice: supplierOffers.costPrice,
          leadTimeDays: supplierOffers.leadTimeDays,
          notes: supplierOffers.notes,
          chosen: supplierOffers.chosen,
        })
        .from(supplierOffers)
        .innerJoin(suppliers, eq(supplierOffers.supplierId, suppliers.id))
        .orderBy(asc(supplierOffers.costPrice))
    : [];

  const rfqs = await db
    .select({
      id: supplierRfqs.id,
      supplierId: supplierRfqs.supplierId,
      supplierName: suppliers.name,
      notes: supplierRfqs.notes,
      replyNotes: supplierRfqs.replyNotes,
    })
    .from(supplierRfqs)
    .innerJoin(suppliers, eq(supplierRfqs.supplierId, suppliers.id))
    .where(eq(supplierRfqs.enquiryId, enquiryId));

  const files = rfqs.length
    ? await db
        .select()
        .from(supplierRfqFiles)
        .orderBy(desc(supplierRfqFiles.createdAt))
    : [];

  const rfqIds = new Set(rfqs.map((rfq) => rfq.id));

  return {
    items: items.map((item) => ({
      ...item,
      offers: offers.filter((offer) => offer.sourcingItemId === item.id),
    })),
    rfqs: rfqs.map((rfq) => ({
      ...rfq,
      files: files.filter((file) => rfqIds.has(file.rfqId) && file.rfqId === rfq.id),
    })),
  };
}

export async function getQuoteReasons(enquiryId: string) {
  const sourcing = await getSourcing(enquiryId);
  return sourcing.items;
}

export async function quoteCanRaisePurchaseOrder(quoteId: string) {
  const db = getDb();
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId));
  if (!quote) return false;
  if (quote.status === "accepted") return true;
  const related = await db
    .select({ amountPaid: invoices.amountPaid })
    .from(invoices)
    .where(eq(invoices.quoteId, quoteId));
  return related.some((invoice) => num(invoice.amountPaid) > 0);
}

export async function listPurchaseOrders() {
  return getDb()
    .select({
      id: purchaseOrders.id,
      number: purchaseOrders.number,
      quoteId: purchaseOrders.quoteId,
      quoteNumber: quotes.number,
      supplierId: purchaseOrders.supplierId,
      supplierName: suppliers.name,
      status: purchaseOrders.status,
      currency: purchaseOrders.currency,
      createdAt: purchaseOrders.createdAt,
    })
    .from(purchaseOrders)
    .innerJoin(quotes, eq(purchaseOrders.quoteId, quotes.id))
    .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .orderBy(desc(purchaseOrders.createdAt));
}

export async function listPurchaseOrdersForQuote(quoteId: string) {
  const rows = await listPurchaseOrders();
  return rows.filter((row) => row.quoteId === quoteId);
}

export async function getPurchaseOrder(id: string) {
  const db = getDb();
  const [order] = await db
    .select({
      id: purchaseOrders.id,
      number: purchaseOrders.number,
      quoteId: purchaseOrders.quoteId,
      quoteNumber: quotes.number,
      supplierId: purchaseOrders.supplierId,
      supplierName: suppliers.name,
      enquiryId: purchaseOrders.enquiryId,
      status: purchaseOrders.status,
      currency: purchaseOrders.currency,
      notes: purchaseOrders.notes,
      createdAt: purchaseOrders.createdAt,
    })
    .from(purchaseOrders)
    .innerJoin(quotes, eq(purchaseOrders.quoteId, quotes.id))
    .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .where(eq(purchaseOrders.id, id));
  if (!order) return null;

  const lines = await db
    .select()
    .from(purchaseOrderLines)
    .where(eq(purchaseOrderLines.purchaseOrderId, id))
    .orderBy(asc(purchaseOrderLines.sortOrder));

  return { ...order, lines };
}
