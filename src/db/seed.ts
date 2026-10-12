import { config } from "dotenv";
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
import {
  customers as seedCustomers,
  enquiries as seedEnquiries,
  invoices as seedInvoices,
  quotes as seedQuotes,
  receipts as seedReceipts,
  suppliers as seedSuppliers,
} from "@/lib/mock-data";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const customerIds: Record<string, string> = {
  "cus-1": "a1000000-0000-4000-8000-000000000001",
  "cus-2": "a1000000-0000-4000-8000-000000000002",
  "cus-3": "a1000000-0000-4000-8000-000000000003",
};

const supplierIds: Record<string, string> = {
  "sup-1": "a2000000-0000-4000-8000-000000000001",
  "sup-2": "a2000000-0000-4000-8000-000000000002",
  "sup-3": "a2000000-0000-4000-8000-000000000003",
};

const enquiryIds: Record<string, string> = {
  "enq-1": "a3000000-0000-4000-8000-000000000001",
  "enq-2": "a3000000-0000-4000-8000-000000000002",
  "enq-3": "a3000000-0000-4000-8000-000000000003",
};

const quoteIds: Record<string, string> = {
  "quo-1": "a4000000-0000-4000-8000-000000000001",
  "quo-2": "a4000000-0000-4000-8000-000000000002",
};

const invoiceIds: Record<string, string> = {
  "inv-1": "a5000000-0000-4000-8000-000000000001",
  "inv-2": "a5000000-0000-4000-8000-000000000002",
};

const paymentId = "a6000000-0000-4000-8000-000000000001";
const receiptId = "a7000000-0000-4000-8000-000000000001";

function sourceValue(source: string) {
  const value = source.toLowerCase();
  if (value === "whatsapp" || value === "phone" || value === "email") {
    return value;
  }
  return "phone";
}

function money(value: number) {
  return value.toFixed(2);
}

async function main() {
  const db = getDb();
  const existing = await db.select({ id: customers.id }).from(customers).limit(1);
  if (existing.length > 0) {
    console.log("Seed skipped; customers already exist.");
    return;
  }

  await db.insert(customers).values(
    seedCustomers.map((customer) => ({
      id: customerIds[customer.id],
      name: customer.name,
      contactPerson: customer.contactPerson,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      address: customer.address,
    })),
  );

  await db.insert(suppliers).values(
    seedSuppliers.map((supplier) => ({
      id: supplierIds[supplier.id],
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      categories: supplier.categories,
    })),
  );

  await db.insert(enquiries).values(
    seedEnquiries.map((enquiry) => ({
      id: enquiryIds[enquiry.id],
      reference: enquiry.reference,
      customerId: customerIds[enquiry.customerId],
      title: enquiry.title,
      description: enquiry.description,
      status: enquiry.status,
      urgency: enquiry.urgency,
      source: sourceValue(enquiry.source),
      assignedTo: enquiry.assignedTo,
      createdAt: new Date(enquiry.createdAt),
      updatedAt: new Date(enquiry.createdAt),
    })),
  );

  await db.insert(quotes).values(
    seedQuotes.map((quote) => ({
      id: quoteIds[quote.id],
      number: quote.number,
      enquiryId: enquiryIds[quote.enquiryId],
      customerId: customerIds[quote.customerId],
      status: quote.status,
      currency: quote.currency,
      subtotal: money(quote.subtotal),
      taxTotal: money(quote.taxTotal),
      total: money(quote.total),
      validUntil: new Date(quote.validUntil),
      version: quote.version,
      createdAt: new Date(quote.createdAt),
      updatedAt: new Date(quote.createdAt),
    })),
  );

  await db.insert(quoteLines).values(
    seedQuotes.flatMap((quote, quoteIndex) =>
      quote.lines.map((line, lineIndex) => ({
        id: `a4100000-0000-4000-8000-${String(quoteIndex * 10 + lineIndex + 1).padStart(12, "0")}`,
        quoteId: quoteIds[quote.id],
        supplierId: supplierIds[line.supplierId],
        description: line.description,
        brand: line.brand,
        quantity: line.quantity.toFixed(3),
        unit: line.unit,
        costPrice: money(line.costPrice),
        sellPrice: money(line.sellPrice),
        leadTimeDays: line.leadTimeDays,
        sortOrder: lineIndex,
      })),
    ),
  );

  await db.insert(invoices).values(
    seedInvoices.map((invoice) => ({
      id: invoiceIds[invoice.id],
      number: invoice.number,
      quoteId: quoteIds[invoice.quoteId],
      customerId: customerIds[invoice.customerId],
      status: invoice.status,
      currency: invoice.currency,
      subtotal: money(invoice.subtotal),
      taxTotal: money(invoice.taxTotal),
      total: money(invoice.total),
      amountPaid: money(invoice.amountPaid),
      dueDate: new Date(invoice.dueDate),
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.createdAt),
    })),
  );

  const invoiceLineRows = seedInvoices.flatMap((invoice) => {
    const quote = seedQuotes.find((item) => item.id === invoice.quoteId);
    if (!quote) return [];
    return quote.lines.map((line, lineIndex) => ({
      id: `a5100000-0000-4000-8000-${String(
        (invoice.id === "inv-1" ? 0 : 10) + lineIndex + 1,
      ).padStart(12, "0")}`,
      invoiceId: invoiceIds[invoice.id],
      supplierId: supplierIds[line.supplierId],
      description: line.description,
      brand: line.brand,
      quantity: line.quantity.toFixed(3),
      unit: line.unit,
      costPrice: money(line.costPrice),
      sellPrice: money(line.sellPrice),
      leadTimeDays: line.leadTimeDays,
      sortOrder: lineIndex,
    }));
  });

  if (invoiceLineRows.length > 0) {
    await db.insert(invoiceLines).values(invoiceLineRows);
  }

  const receipt = seedReceipts[0];
  const invoice = seedInvoices.find((item) => item.id === receipt.invoiceId);
  if (!receipt || !invoice) {
    throw new Error("Seed receipt is missing its invoice.");
  }

  await db.insert(payments).values({
    id: paymentId,
    invoiceId: invoiceIds[receipt.invoiceId],
    amount: money(receipt.amount),
    currency: receipt.currency,
    method: "bank_transfer",
    reference: "Seed deposit",
    paidAt: new Date(receipt.issuedAt),
  });

  await db.insert(receipts).values({
    id: receiptId,
    number: receipt.number,
    paymentId,
    customerId: customerIds[receipt.customerId],
    amount: money(receipt.amount),
    currency: receipt.currency,
    issuedAt: new Date(receipt.issuedAt),
  });

  console.log("Seeded customers, suppliers, enquiries, quotes, invoices, and a receipt.");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
