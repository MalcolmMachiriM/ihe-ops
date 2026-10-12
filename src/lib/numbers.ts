import { like } from "drizzle-orm";
import type { Db } from "@/db";
import { enquiries, invoices, purchaseOrders, quotes, receipts } from "@/db/schema";

export type DocumentPrefix = "ENQ" | "QT" | "PF" | "INV" | "RCP" | "PO";

type NumberDb = Pick<Db, "select">;

export async function nextDocumentNumber(db: NumberDb, prefix: DocumentPrefix) {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;
  const rows = await selectNumbers(db, prefix, pattern);
  let max = 0;

  for (const value of rows) {
    const sequence = Number(value.split("-").at(-1));
    if (Number.isFinite(sequence) && sequence > max) {
      max = sequence;
    }
  }

  return `${prefix}-${year}-${String(max + 1).padStart(4, "0")}`;
}

async function selectNumbers(
  db: NumberDb,
  prefix: DocumentPrefix,
  pattern: string,
) {
  if (prefix === "ENQ") {
    const rows = await db
      .select({ value: enquiries.reference })
      .from(enquiries)
      .where(like(enquiries.reference, pattern));
    return rows.map((row) => row.value);
  }

  if (prefix === "QT") {
    const rows = await db
      .select({ value: quotes.number })
      .from(quotes)
      .where(like(quotes.number, pattern));
    return rows.map((row) => row.value);
  }

  if (prefix === "PO") {
    const rows = await db
      .select({ value: purchaseOrders.number })
      .from(purchaseOrders)
      .where(like(purchaseOrders.number, pattern));
    return rows.map((row) => row.value);
  }

  if (prefix === "RCP") {
    const rows = await db
      .select({ value: receipts.number })
      .from(receipts)
      .where(like(receipts.number, pattern));
    return rows.map((row) => row.value);
  }

  const rows = await db
    .select({ value: invoices.number })
    .from(invoices)
    .where(like(invoices.number, pattern));
  return rows.map((row) => row.value);
}
