"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  creditNotes,
  enquiries,
  invoiceLines,
  invoices,
  payments,
  quoteLines,
  quotes,
  receipts,
} from "@/db/schema";
import { invoiceBalance } from "@/lib/approvals";
import { guardRole } from "@/lib/auth";
import { moneyString, num, roundMoney } from "@/lib/format";
import { nextDocumentNumber } from "@/lib/numbers";
import {
  type ActionState,
  creditSchema,
  field,
  paymentSchema,
  zodError,
} from "@/lib/schemas";

async function convertQuote(
  quoteId: string,
  kind: "proforma" | "invoice",
): Promise<ActionState> {
  const denied =
    kind === "proforma"
      ? await guardRole("admin", "sales")
      : await guardRole("admin", "accounts");
  if (denied) return denied;

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [quote] = await tx.select().from(quotes).where(eq(quotes.id, quoteId));
    if (!quote) return { error: "Quote not found." } as const;
    if (quote.status !== "sent" && quote.status !== "accepted") {
      return {
        error: "Mark the quote as sent before converting it.",
      } as const;
    }

    const existing = await tx
      .select({ status: invoices.status })
      .from(invoices)
      .where(eq(invoices.quoteId, quoteId));

    if (kind === "proforma" && existing.some((row) => row.status === "proforma")) {
      return { error: "This quote already has a proforma." } as const;
    }
    if (
      kind === "invoice" &&
      existing.some((row) => row.status !== "proforma" && row.status !== "void")
    ) {
      return { error: "This quote already has an invoice." } as const;
    }

    const lines = await tx
      .select()
      .from(quoteLines)
      .where(eq(quoteLines.quoteId, quoteId));
    const number = await nextDocumentNumber(tx, kind === "proforma" ? "PF" : "INV");
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const [invoice] = await tx
      .insert(invoices)
      .values({
        number,
        quoteId,
        customerId: quote.customerId,
        status: kind === "proforma" ? "proforma" : "issued",
        currency: quote.currency,
        subtotal: quote.subtotal,
        taxTotal: quote.taxTotal,
        total: quote.total,
        amountPaid: "0.00",
        dueDate,
        notes: quote.notes,
      })
      .returning({ id: invoices.id });

    if (lines.length > 0) {
      await tx.insert(invoiceLines).values(
        lines.map((line) => ({
          invoiceId: invoice.id,
          supplierId: line.supplierId,
          description: line.description,
          brand: line.brand,
          quantity: line.quantity,
          unit: line.unit,
          costPrice: line.costPrice,
          sellPrice: line.sellPrice,
          leadTimeDays: line.leadTimeDays,
          sortOrder: line.sortOrder,
        })),
      );
    }

    await tx
      .update(quotes)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(quotes.id, quoteId));

    if (quote.enquiryId) {
      await tx
        .update(enquiries)
        .set({ status: "won", updatedAt: new Date() })
        .where(eq(enquiries.id, quote.enquiryId));
    }

    return { id: invoice.id };
  });

  if (!("id" in result)) return { error: result.error };

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/invoices");
  revalidatePath("/enquiries");
  revalidatePath("/");
  redirect(`/invoices/${result.id}`);
}

export async function createProforma(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return convertQuote(field(formData, "quoteId"), "proforma");
}

export async function createInvoice(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return convertQuote(field(formData, "quoteId"), "invoice");
}

export async function recordPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "accounts");
  if (denied) return denied;

  const parsed = paymentSchema.safeParse({
    invoiceId: field(formData, "invoiceId"),
    amount: Number(field(formData, "amount")),
    method: field(formData, "method"),
    reference: field(formData, "reference"),
    paidAt: field(formData, "paidAt"),
  });
  if (!parsed.success) return { error: zodError(parsed.error) };

  const data = parsed.data;
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, data.invoiceId));
    if (!invoice) return { error: "Invoice not found." } as const;
    if (invoice.status === "void") {
      return { error: "This invoice is void." } as const;
    }

    const existingCredits = await tx
      .select({ amount: creditNotes.amount })
      .from(creditNotes)
      .where(eq(creditNotes.invoiceId, invoice.id));
    const credited = existingCredits.reduce((sum, credit) => sum + num(credit.amount), 0);
    const balance = invoiceBalance(invoice.total, invoice.amountPaid, credited);
    const amount = roundMoney(data.amount);
    if (amount > balance + 0.001) {
      return { error: "Payment is higher than the balance." } as const;
    }

    const [payment] = await tx
      .insert(payments)
      .values({
        invoiceId: invoice.id,
        amount: moneyString(amount),
        currency: invoice.currency,
        method: data.method,
        reference: data.reference || null,
        paidAt: new Date(data.paidAt),
      })
      .returning({ id: payments.id });

    const number = await nextDocumentNumber(tx, "RCP");
    const [receipt] = await tx
      .insert(receipts)
      .values({
        number,
        paymentId: payment.id,
        customerId: invoice.customerId,
        amount: moneyString(amount),
        currency: invoice.currency,
        issuedAt: new Date(data.paidAt),
      })
      .returning({ id: receipts.id });

    const amountPaid = roundMoney(num(invoice.amountPaid) + amount);
    const remaining = invoiceBalance(invoice.total, amountPaid, credited);
    const status = remaining <= 0.001 ? "paid" : "partial";
    await tx
      .update(invoices)
      .set({
        amountPaid: moneyString(amountPaid),
        status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id));

    return { receiptId: receipt.id, invoiceId: invoice.id };
  });

  if (!("receiptId" in result)) return { error: result.error };

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${result.invoiceId}`);
  revalidatePath("/receipts");
  revalidatePath("/");
  redirect(`/receipts/${result.receiptId}`);
}

export async function issueCreditNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "accounts");
  if (denied) return denied;

  const parsed = creditSchema.safeParse({
    invoiceId: field(formData, "invoiceId"),
    amount: Number(field(formData, "amount")),
    reason: field(formData, "reason"),
  });
  if (!parsed.success) return { error: zodError(parsed.error) };

  const data = parsed.data;
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, data.invoiceId));
    if (!invoice) return { error: "Invoice not found." } as const;
    if (invoice.status === "void") return { error: "This invoice is void." } as const;

    const existingCredits = await tx
      .select({ amount: creditNotes.amount })
      .from(creditNotes)
      .where(eq(creditNotes.invoiceId, invoice.id));
    const credited = existingCredits.reduce((sum, credit) => sum + num(credit.amount), 0);
    const amount = roundMoney(data.amount);
    const balance = invoiceBalance(invoice.total, invoice.amountPaid, credited);
    if (amount > balance + 0.001) {
      return { error: "Credit is higher than the balance." } as const;
    }

    const number = await nextDocumentNumber(tx, "CN");
    const [note] = await tx
      .insert(creditNotes)
      .values({
        number,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        amount: moneyString(amount),
        currency: invoice.currency,
        reason: data.reason,
      })
      .returning({ id: creditNotes.id });

    const remaining = invoiceBalance(invoice.total, invoice.amountPaid, credited + amount);
    const status =
      remaining <= 0.001 ? "paid" : invoice.status === "proforma" ? "proforma" : "partial";
    await tx
      .update(invoices)
      .set({ status, updatedAt: new Date() })
      .where(eq(invoices.id, invoice.id));

    return { noteId: note.id, invoiceId: invoice.id };
  });

  if (!("noteId" in result)) return { error: result.error };

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${result.invoiceId}`);
  revalidatePath("/reports");
  revalidatePath("/");
  redirect(`/invoices/${result.invoiceId}`);
}
