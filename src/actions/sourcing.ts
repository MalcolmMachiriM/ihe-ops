"use server";

import { put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  enquiries,
  invoices,
  purchaseOrderLines,
  purchaseOrders,
  quoteLines,
  quotes,
  sourcingItems,
  supplierOffers,
  supplierRfqFiles,
  supplierRfqs,
} from "@/db/schema";
import { guardRole } from "@/lib/auth";
import { moneyString, num, roundMoney } from "@/lib/format";
import { nextDocumentNumber } from "@/lib/numbers";
import { type ActionState, field, zodError } from "@/lib/schemas";
import { z } from "zod";

const enquiryStatuses = ["new", "sourcing", "quoted", "won", "lost", "expired"] as const;

async function markSourcing(enquiryId: string) {
  const db = getDb();
  const [enquiry] = await db
    .select({ status: enquiries.status })
    .from(enquiries)
    .where(eq(enquiries.id, enquiryId));
  if (enquiry?.status === "new") {
    await db
      .update(enquiries)
      .set({ status: "sourcing", updatedAt: new Date() })
      .where(eq(enquiries.id, enquiryId));
  }
}

export async function setEnquiryStatus(formData: FormData) {
  const denied = await guardRole("admin", "sales");
  if (denied) throw new Error(denied.error);
  const id = field(formData, "id");
  const status = field(formData, "status");
  if (!z.string().uuid().safeParse(id).success) throw new Error("Enquiry not found.");
  if (!enquiryStatuses.includes(status as (typeof enquiryStatuses)[number])) {
    throw new Error("Unknown status.");
  }
  await getDb()
    .update(enquiries)
    .set({ status: status as (typeof enquiryStatuses)[number], updatedAt: new Date() })
    .where(eq(enquiries.id, id));
  revalidatePath("/enquiries");
  revalidatePath(`/enquiries/${id}`);
  revalidatePath("/");
  redirect(`/enquiries/${id}`);
}

export async function addSourcingItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;
  const parsed = z
    .object({
      enquiryId: z.string().uuid(),
      description: z.string().trim().min(1, "Describe the item to source"),
      quantity: z.number().positive(),
      unit: z.string().trim().min(1).default("ea"),
    })
    .safeParse({
      enquiryId: field(formData, "enquiryId"),
      description: field(formData, "description"),
      quantity: Number(field(formData, "quantity") || "1"),
      unit: field(formData, "unit") || "ea",
    });
  if (!parsed.success) return { error: zodError(parsed.error) };

  const db = getDb();
  const existing = await db
    .select({ id: sourcingItems.id })
    .from(sourcingItems)
    .where(eq(sourcingItems.enquiryId, parsed.data.enquiryId));
  await db.insert(sourcingItems).values({
    enquiryId: parsed.data.enquiryId,
    description: parsed.data.description,
    quantity: parsed.data.quantity.toFixed(3),
    unit: parsed.data.unit,
    sortOrder: existing.length,
  });
  await markSourcing(parsed.data.enquiryId);
  revalidatePath(`/enquiries/${parsed.data.enquiryId}`);
  redirect(`/enquiries/${parsed.data.enquiryId}`);
}

export async function addSupplierOffer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;
  const parsed = z
    .object({
      enquiryId: z.string().uuid(),
      sourcingItemId: z.string().uuid(),
      supplierId: z.string().uuid("Choose a supplier"),
      brand: z.string().trim().default(""),
      costPrice: z.number().min(0),
      leadTimeDays: z.number().int().min(0).nullable(),
    })
    .safeParse({
      enquiryId: field(formData, "enquiryId"),
      sourcingItemId: field(formData, "sourcingItemId"),
      supplierId: field(formData, "supplierId"),
      brand: field(formData, "brand"),
      costPrice: Number(field(formData, "costPrice") || "0"),
      leadTimeDays: field(formData, "leadTimeDays") === "" ? null : Number(field(formData, "leadTimeDays")),
    });
  if (!parsed.success) return { error: zodError(parsed.error) };

  await getDb().insert(supplierOffers).values({
    sourcingItemId: parsed.data.sourcingItemId,
    supplierId: parsed.data.supplierId,
    brand: parsed.data.brand || null,
    costPrice: moneyString(parsed.data.costPrice),
    leadTimeDays: parsed.data.leadTimeDays,
  });
  await markSourcing(parsed.data.enquiryId);
  revalidatePath(`/enquiries/${parsed.data.enquiryId}`);
  redirect(`/enquiries/${parsed.data.enquiryId}`);
}

export async function chooseOffer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;
  const enquiryId = field(formData, "enquiryId");
  const offerId = field(formData, "offerId");
  const sourcingItemId = field(formData, "sourcingItemId");
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(supplierOffers)
      .set({ chosen: false })
      .where(eq(supplierOffers.sourcingItemId, sourcingItemId));
    await tx.update(supplierOffers).set({ chosen: true }).where(eq(supplierOffers.id, offerId));
  });
  revalidatePath(`/enquiries/${enquiryId}`);
  redirect(`/enquiries/${enquiryId}`);
}

export async function saveSupplierRfq(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;
  const parsed = z
    .object({
      enquiryId: z.string().uuid(),
      supplierId: z.string().uuid("Choose a supplier"),
      notes: z.string().trim().default(""),
      replyNotes: z.string().trim().default(""),
    })
    .safeParse({
      enquiryId: field(formData, "enquiryId"),
      supplierId: field(formData, "supplierId"),
      notes: field(formData, "notes"),
      replyNotes: field(formData, "replyNotes"),
    });
  if (!parsed.success) return { error: zodError(parsed.error) };

  const db = getDb();
  const [existing] = await db
    .select({ id: supplierRfqs.id })
    .from(supplierRfqs)
    .where(
      and(
        eq(supplierRfqs.enquiryId, parsed.data.enquiryId),
        eq(supplierRfqs.supplierId, parsed.data.supplierId),
      ),
    );
  if (existing) {
    await db
      .update(supplierRfqs)
      .set({
        notes: parsed.data.notes || null,
        replyNotes: parsed.data.replyNotes || null,
        updatedAt: new Date(),
      })
      .where(eq(supplierRfqs.id, existing.id));
  } else {
    await db.insert(supplierRfqs).values({
      enquiryId: parsed.data.enquiryId,
      supplierId: parsed.data.supplierId,
      notes: parsed.data.notes || null,
      replyNotes: parsed.data.replyNotes || null,
    });
  }
  await markSourcing(parsed.data.enquiryId);
  revalidatePath(`/enquiries/${parsed.data.enquiryId}`);
  redirect(`/enquiries/${parsed.data.enquiryId}`);
}

const allowedTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

export async function attachSupplierReply(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;
  const enquiryId = field(formData, "enquiryId");
  const rfqId = field(formData, "rfqId");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a supplier reply file." };
  if (file.size > 8 * 1024 * 1024) return { error: "File must be under 8MB." };
  if (!allowedTypes.has(file.type)) return { error: "Attach a PDF or image." };
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { error: "Set BLOB_READ_WRITE_TOKEN before attaching supplier files." };
  }
  const [rfq] = await getDb()
    .select({ id: supplierRfqs.id })
    .from(supplierRfqs)
    .where(and(eq(supplierRfqs.id, rfqId), eq(supplierRfqs.enquiryId, enquiryId)));
  if (!rfq) return { error: "Supplier request not found." };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const blob = await put(`rfq/${rfqId}/${Date.now()}-${safeName}`, file, {
    access: "private",
    contentType: file.type,
  });
  await getDb().insert(supplierRfqFiles).values({
    rfqId,
    fileName: file.name,
    url: blob.url,
    contentType: file.type,
  });
  revalidatePath(`/enquiries/${enquiryId}`);
  redirect(`/enquiries/${enquiryId}`);
}

export async function createQuoteFromWinners(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;
  const enquiryId = field(formData, "enquiryId");
  const markup = Number(field(formData, "markup") || "30");
  if (!Number.isFinite(markup)) return { error: "Enter a markup percent." };

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [enquiry] = await tx.select().from(enquiries).where(eq(enquiries.id, enquiryId));
    if (!enquiry) return { error: "Enquiry not found." } as const;

    const items = await tx
      .select()
      .from(sourcingItems)
      .where(eq(sourcingItems.enquiryId, enquiryId));
    if (items.length === 0) return { error: "Add lines to source first." } as const;

    const offers = await tx.select().from(supplierOffers);
    const winners = items.map((item) => {
      const chosen = offers.find((offer) => offer.sourcingItemId === item.id && offer.chosen);
      return { item, chosen };
    });
    if (winners.some((row) => !row.chosen)) {
      return { error: "Choose a winning supplier for every line." } as const;
    }

    const supplierIds = [...new Set(winners.map((row) => row.chosen!.supplierId))];
    const supplierRows = await tx
      .select({ supplierId: supplierRfqs.supplierId, replyNotes: supplierRfqs.replyNotes, notes: supplierRfqs.notes })
      .from(supplierRfqs)
      .where(eq(supplierRfqs.enquiryId, enquiryId));
    const why = supplierRows
      .filter((row) => supplierIds.includes(row.supplierId) && (row.replyNotes || row.notes))
      .map((row) => row.replyNotes || row.notes)
      .filter(Boolean)
      .join("\n");

    const number = await nextDocumentNumber(tx, "QT");
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 14);
    const lineValues = winners.map((row) => {
      const cost = num(row.chosen!.costPrice);
      const sell = roundMoney(cost * (1 + markup / 100));
      return {
        description: row.item.description,
        brand: row.chosen!.brand,
        quantity: row.item.quantity,
        unit: row.item.unit,
        supplierId: row.chosen!.supplierId,
        costPrice: moneyString(cost),
        sellPrice: moneyString(sell),
        leadTimeDays: row.chosen!.leadTimeDays,
        offerId: row.chosen!.id,
        lineTotal: num(row.item.quantity) * sell,
      };
    });
    const subtotal = roundMoney(lineValues.reduce((sum, line) => sum + line.lineTotal, 0));
    const [quote] = await tx
      .insert(quotes)
      .values({
        number,
        enquiryId,
        customerId: enquiry.customerId,
        status: "draft",
        currency: "USD",
        subtotal: moneyString(subtotal),
        taxTotal: "0.00",
        total: moneyString(subtotal),
        validUntil,
        notes: why || `Built from the supplier compare on ${enquiry.reference}.`,
        terms: "Prices sourced on request and valid until the date above.",
      })
      .returning({ id: quotes.id });

    await tx.insert(quoteLines).values(
      lineValues.map((line, index) => ({
        quoteId: quote.id,
        supplierId: line.supplierId,
        description: line.description,
        brand: line.brand,
        quantity: line.quantity,
        unit: line.unit,
        costPrice: line.costPrice,
        sellPrice: line.sellPrice,
        leadTimeDays: line.leadTimeDays,
        sortOrder: index,
        offerId: line.offerId,
      })),
    );

    if (enquiry.status === "new" || enquiry.status === "sourcing") {
      await tx
        .update(enquiries)
        .set({ status: "quoted", updatedAt: new Date() })
        .where(eq(enquiries.id, enquiryId));
    }

    return { id: quote.id };
  });

  if (!("id" in result)) return { error: result.error };
  revalidatePath("/quotes");
  revalidatePath("/enquiries");
  revalidatePath(`/enquiries/${enquiryId}`);
  redirect(`/quotes/${result.id}`);
}

export async function createPurchaseOrders(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;
  const quoteId = field(formData, "quoteId");
  const db = getDb();

  const result = await db.transaction(async (tx) => {
    const [quote] = await tx.select().from(quotes).where(eq(quotes.id, quoteId));
    if (!quote) return { error: "Quote not found." } as const;
    const related = await tx
      .select({ amountPaid: invoices.amountPaid, status: invoices.status })
      .from(invoices)
      .where(eq(invoices.quoteId, quoteId));
    const depositPaid = related.some((invoice) => num(invoice.amountPaid) > 0);
    if (quote.status !== "accepted" && !depositPaid) {
      return { error: "Create a purchase order after the client accepts or pays a deposit." } as const;
    }

    const lines = await tx.select().from(quoteLines).where(eq(quoteLines.quoteId, quoteId));
    const grouped = new Map<string, typeof lines>();
    for (const line of lines) {
      if (!line.supplierId) continue;
      const current = grouped.get(line.supplierId) ?? [];
      current.push(line);
      grouped.set(line.supplierId, current);
    }
    if (grouped.size === 0) return { error: "Quote lines need a supplier before a purchase order." } as const;

    const existing = await tx
      .select({ supplierId: purchaseOrders.supplierId })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.quoteId, quoteId));
    const already = new Set(existing.map((row) => row.supplierId));
    let firstId: string | null = null;

    for (const [supplierId, supplierLines] of grouped) {
      if (already.has(supplierId)) continue;
      const number = await nextDocumentNumber(tx, "PO");
      const [order] = await tx
        .insert(purchaseOrders)
        .values({
          number,
          quoteId,
          supplierId,
          enquiryId: quote.enquiryId,
          currency: quote.currency,
          notes: `Raised from ${quote.number} after the client accepted or paid a deposit.`,
        })
        .returning({ id: purchaseOrders.id });
      firstId = firstId ?? order.id;
      await tx.insert(purchaseOrderLines).values(
        supplierLines.map((line, index) => ({
          purchaseOrderId: order.id,
          description: line.description,
          brand: line.brand,
          quantity: line.quantity,
          unit: line.unit,
          costPrice: line.costPrice,
          leadTimeDays: line.leadTimeDays,
          sortOrder: index,
        })),
      );
    }

    if (!firstId) return { error: "Purchase orders already exist for this quote." } as const;
    return { id: firstId };
  });

  if (!("id" in result)) return { error: result.error };
  revalidatePath("/purchase-orders");
  revalidatePath(`/quotes/${quoteId}`);
  redirect(`/purchase-orders/${result.id}`);
}

export async function setPurchaseOrderStatus(formData: FormData) {
  const denied = await guardRole("admin", "sales");
  if (denied) throw new Error(denied.error);
  const id = field(formData, "id");
  const status = field(formData, "status");
  if (status !== "draft" && status !== "sent" && status !== "cancelled") {
    throw new Error("Unknown purchase order status.");
  }
  await getDb()
    .update(purchaseOrders)
    .set({ status, updatedAt: new Date() })
    .where(eq(purchaseOrders.id, id));
  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${id}`);
  redirect(`/purchase-orders/${id}`);
}
