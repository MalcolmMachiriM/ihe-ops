import { and, eq, like, sql } from "drizzle-orm";
import type { Db } from "@/db";
import {
  creditNotes,
  documentSequences,
  enquiries,
  invoices,
  purchaseOrders,
  quotes,
  receipts,
} from "@/db/schema";

export type DocumentPrefix = "ENQ" | "QT" | "PF" | "INV" | "RCP" | "PO" | "CN";

type NumberDb = Pick<Db, "select" | "insert" | "update">;

export async function nextDocumentNumber(db: NumberDb, prefix: DocumentPrefix) {
  const year = new Date().getFullYear();
  const currentMax = await highestNumber(db, prefix, `${prefix}-${year}-%`);

  await db
    .insert(documentSequences)
    .values({ prefix, year, lastNumber: currentMax })
    .onConflictDoNothing();

  await db
    .update(documentSequences)
    .set({
      lastNumber: sql`GREATEST(${documentSequences.lastNumber}, ${currentMax})`,
    })
    .where(and(eq(documentSequences.prefix, prefix), eq(documentSequences.year, year)));

  const [row] = await db
    .update(documentSequences)
    .set({ lastNumber: sql`${documentSequences.lastNumber} + 1` })
    .where(and(eq(documentSequences.prefix, prefix), eq(documentSequences.year, year)))
    .returning({ lastNumber: documentSequences.lastNumber });

  return `${prefix}-${year}-${String(row?.lastNumber ?? currentMax + 1).padStart(4, "0")}`;
}

async function highestNumber(db: NumberDb, prefix: DocumentPrefix, pattern: string) {
  const rows = await selectNumbers(db, prefix, pattern);
  let max = 0;
  for (const value of rows) {
    const sequence = Number(value.split("-").at(-1));
    if (Number.isFinite(sequence) && sequence > max) max = sequence;
  }
  return max;
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

  if (prefix === "CN") {
    const rows = await db
      .select({ value: creditNotes.number })
      .from(creditNotes)
      .where(like(creditNotes.number, pattern));
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
