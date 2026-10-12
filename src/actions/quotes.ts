"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { enquiries, quoteLines, quotes } from "@/db/schema";
import { guardRole } from "@/lib/auth";
import { moneyString, roundMoney } from "@/lib/format";
import { nextDocumentNumber } from "@/lib/numbers";
import {
  type ActionState,
  field,
  optionalId,
  quoteSchema,
  zodError,
} from "@/lib/schemas";

export async function saveQuote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;

  let lines: unknown;
  try {
    lines = JSON.parse(field(formData, "lines") || "[]");
  } catch {
    return { error: "Quote lines could not be read." };
  }

  const parsed = quoteSchema.safeParse({
    id: optionalId(field(formData, "id")),
    enquiryId: optionalId(field(formData, "enquiryId")),
    customerId: field(formData, "customerId"),
    status: field(formData, "status") || "draft",
    currency: field(formData, "currency") || "USD",
    validUntil: field(formData, "validUntil"),
    notes: field(formData, "notes"),
    terms: field(formData, "terms"),
    lines,
  });
  if (!parsed.success) return { error: zodError(parsed.error) };

  const data = parsed.data;
  const subtotal = roundMoney(
    data.lines.reduce((sum, line) => sum + line.quantity * line.sellPrice, 0),
  );
  const db = getDb();

  const savedId = await db.transaction(async (tx) => {
    let quoteId = data.id;
    let version = 1;

    if (quoteId) {
      const [existing] = await tx
        .select()
        .from(quotes)
        .where(eq(quotes.id, quoteId));
      if (!existing) return { error: "Quote not found." } as const;
      version = existing.status === "draft" ? existing.version : existing.version + 1;
      await tx
        .update(quotes)
        .set({
          enquiryId: data.enquiryId ?? null,
          customerId: data.customerId,
          status: data.status,
          currency: data.currency.toUpperCase(),
          subtotal: moneyString(subtotal),
          taxTotal: "0.00",
          total: moneyString(subtotal),
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          notes: data.notes || null,
          terms: data.terms || null,
          version,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, quoteId));
      await tx.delete(quoteLines).where(eq(quoteLines.quoteId, quoteId));
    } else {
      const number = await nextDocumentNumber(tx, "QT");
      const [created] = await tx
        .insert(quotes)
        .values({
          number,
          enquiryId: data.enquiryId ?? null,
          customerId: data.customerId,
          status: data.status,
          currency: data.currency.toUpperCase(),
          subtotal: moneyString(subtotal),
          taxTotal: "0.00",
          total: moneyString(subtotal),
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          notes: data.notes || null,
          terms: data.terms || null,
          version: 1,
        })
        .returning({ id: quotes.id });
      quoteId = created.id;
    }

    await tx.insert(quoteLines).values(
      data.lines.map((line, index) => ({
        quoteId: quoteId!,
        supplierId: line.supplierId,
        description: line.description,
        brand: line.brand || null,
        quantity: line.quantity.toFixed(3),
        unit: line.unit,
        costPrice: moneyString(line.costPrice),
        sellPrice: moneyString(line.sellPrice),
        leadTimeDays: line.leadTimeDays,
        sortOrder: index,
      })),
    );

    if (data.enquiryId) {
      const [enquiry] = await tx
        .select({ status: enquiries.status })
        .from(enquiries)
        .where(eq(enquiries.id, data.enquiryId));
      if (enquiry && (enquiry.status === "new" || enquiry.status === "sourcing")) {
        await tx
          .update(enquiries)
          .set({ status: "quoted", updatedAt: new Date() })
          .where(eq(enquiries.id, data.enquiryId));
      }
    }

    return { id: quoteId! };
  });

  if (!("id" in savedId)) return { error: savedId.error };

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${savedId.id}`);
  revalidatePath("/enquiries");
  revalidatePath("/");
  redirect(`/quotes/${savedId.id}`);
}
