import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  creditNotes,
  enquiries,
  invoices,
  payments,
  quoteLines,
  quotes,
  suppliers,
} from "@/db/schema";
import { getCustomer, listInvoices } from "@/db/queries";
import { num, roundMoney } from "@/lib/format";

export async function getOperationsReport() {
  const db = getDb();
  const invoiceRows = await listInvoices();
  const lineRows = await db
    .select({
      quoteId: quotes.id,
      number: quotes.number,
      currency: quotes.currency,
      status: quotes.status,
      total: quotes.total,
      quantity: quoteLines.quantity,
      costPrice: quoteLines.costPrice,
      sellPrice: quoteLines.sellPrice,
      category: suppliers.categories,
      assignedTo: enquiries.assignedTo,
    })
    .from(quoteLines)
    .innerJoin(quotes, eq(quoteLines.quoteId, quotes.id))
    .leftJoin(suppliers, eq(quoteLines.supplierId, suppliers.id))
    .leftJoin(enquiries, eq(quotes.enquiryId, enquiries.id));

  const byQuote = new Map<string, MarginRow>();
  const byCategory = new Map<string, MarginRow>();
  const bySalesperson = new Map<string, MarginRow>();
  const pipeline = new Map<string, { status: string; currency: string; count: number; amount: number }>();
  const seenQuotes = new Set<string>();

  for (const line of lineRows) {
    const cost = num(line.quantity) * num(line.costPrice);
    const sell = num(line.quantity) * num(line.sellPrice);
    addMargin(byQuote, `${line.number}::${line.currency}`, line.number, line.currency, cost, sell);
    const category = line.category?.trim() || "Uncategorised";
    addMargin(byCategory, `${category}::${line.currency}`, category, line.currency, cost, sell);
    const salesperson = line.assignedTo?.trim() || "Unassigned";
    addMargin(
      bySalesperson,
      `${salesperson}::${line.currency}`,
      salesperson,
      line.currency,
      cost,
      sell,
    );

    if (!seenQuotes.has(line.quoteId) && (line.status === "draft" || line.status === "sent")) {
      seenQuotes.add(line.quoteId);
      const key = `${line.status}::${line.currency}`;
      const current = pipeline.get(key) ?? {
        status: line.status,
        currency: line.currency,
        count: 0,
        amount: 0,
      };
      current.count += 1;
      current.amount += num(line.total);
      pipeline.set(key, current);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ageing = new Map<string, AgeingRow>();
  for (const invoice of invoiceRows) {
    if (invoice.balance <= 0.001 || invoice.status === "void" || invoice.status === "draft") continue;
    const row = ageing.get(invoice.currency) ?? emptyAgeing(invoice.currency);
    row[ageBucket(invoice.dueDate, today)] += invoice.balance;
    ageing.set(invoice.currency, row);
  }

  return {
    pipeline: [...pipeline.values()],
    byQuote: [...byQuote.values()],
    byCategory: [...byCategory.values()],
    bySalesperson: [...bySalesperson.values()],
    ageing: [...ageing.values()],
  };
}

export async function getCustomerStatement(customerId: string) {
  const customer = await getCustomer(customerId);
  if (!customer) return null;
  const db = getDb();
  const invoiceRows = (await listInvoices()).filter(
    (invoice) =>
      invoice.customerId === customerId &&
      invoice.status !== "void" &&
      invoice.status !== "draft",
  );
  const paymentRows = await db
    .select({
      amount: payments.amount,
      paidAt: payments.paidAt,
      currency: payments.currency,
      invoiceNumber: invoices.number,
    })
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .where(eq(invoices.customerId, customerId));
  const creditRows = await db
    .select()
    .from(creditNotes)
    .where(eq(creditNotes.customerId, customerId));

  const entries = [
    ...invoiceRows.map((invoice) => ({
      date: invoice.createdAt,
      label: invoice.number,
      currency: invoice.currency,
      debit: num(invoice.total),
      credit: 0,
    })),
    ...paymentRows.map((payment) => ({
      date: payment.paidAt,
      label: `Payment on ${payment.invoiceNumber}`,
      currency: payment.currency,
      debit: 0,
      credit: num(payment.amount),
    })),
    ...creditRows.map((credit) => ({
      date: credit.createdAt,
      label: credit.number,
      currency: credit.currency,
      debit: 0,
      credit: num(credit.amount),
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const running = new Map<string, number>();
  const rows = entries.map((entry) => {
    const balance = roundMoney((running.get(entry.currency) ?? 0) + entry.debit - entry.credit);
    running.set(entry.currency, balance);
    return { ...entry, balance };
  });

  return { customer, rows, balances: [...running.entries()] };
}

type MarginRow = {
  label: string;
  currency: string;
  cost: number;
  sell: number;
};

type AgeingRow = {
  currency: string;
  current: number;
  d30: number;
  d60: number;
  d90: number;
  older: number;
};

function addMargin(
  map: Map<string, MarginRow>,
  key: string,
  label: string,
  currency: string,
  cost: number,
  sell: number,
) {
  const current = map.get(key) ?? { label, currency, cost: 0, sell: 0 };
  current.cost += cost;
  current.sell += sell;
  map.set(key, current);
}

function emptyAgeing(currency: string): AgeingRow {
  return { currency, current: 0, d30: 0, d60: 0, d90: 0, older: 0 };
}

function ageBucket(due: Date | null, today: Date): keyof Omit<AgeingRow, "currency"> {
  if (!due || due >= today) return "current";
  const days = (today.getTime() - due.getTime()) / 86_400_000;
  if (days <= 30) return "d30";
  if (days <= 60) return "d60";
  if (days <= 90) return "d90";
  return "older";
}
