"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  auditEvents,
  enquiries,
  productTemplates,
  quoteApprovals,
  quoteLines,
  quotes,
} from "@/db/schema";
import { approvalReason, needsApproval } from "@/lib/approvals";
import { AuthError, requireRole } from "@/lib/auth";
import { moneyString, num, roundMoney } from "@/lib/format";
import { quoteMargin } from "@/lib/margin";
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
  const denied = await guardQuote();
  if (denied.error || !denied.user) {
    return { error: denied.error ?? "You do not have access to this action." };
  }
  const actor = denied.user;

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
  const margin = quoteMargin(
    data.lines.map((line) => ({
      quantity: line.quantity,
      cost: line.costPrice,
      sell: line.sellPrice,
    })),
  );
  const flagged = needsApproval(
    data.lines.map((line) => ({
      quantity: line.quantity,
      cost: line.costPrice,
      sell: line.sellPrice,
    })),
    margin.percent,
  );
  const db = getDb();

  const savedId = await db.transaction(async (tx) => {
    let quoteId = data.id;
    let version = 1;
    let previous:
      | {
          terms: string | null;
          currency: string;
          validUntil: Date | null;
          lines: {
            description: string;
            quantity: string;
            costPrice: string;
            sellPrice: string;
          }[];
        }
      | undefined;

    if (quoteId) {
      const [existing] = await tx.select().from(quotes).where(eq(quotes.id, quoteId));
      if (!existing) return { error: "Quote not found." } as const;
      const oldLines = await tx
        .select({
          description: quoteLines.description,
          quantity: quoteLines.quantity,
          costPrice: quoteLines.costPrice,
          sellPrice: quoteLines.sellPrice,
        })
        .from(quoteLines)
        .where(eq(quoteLines.quoteId, quoteId));
      previous = {
        terms: existing.terms,
        currency: existing.currency,
        validUntil: existing.validUntil,
        lines: oldLines,
      };
      version = existing.status === "draft" ? existing.version : existing.version + 1;
    }

    let status = data.status;
    let held = false;
    if (quoteId && previous && lineFingerprint(previous.lines) !== lineFingerprint(data.lines)) {
      await tx
        .update(quoteApprovals)
        .set({ status: "rejected", decidedBy: actor.userId, decidedAt: new Date() })
        .where(
          and(
            eq(quoteApprovals.quoteId, quoteId),
            eq(quoteApprovals.version, version),
            eq(quoteApprovals.status, "approved"),
          ),
        );
    }

    if (status === "sent" && flagged && actor.role !== "admin") {
      const approved = quoteId
        ? await tx
            .select({ id: quoteApprovals.id })
            .from(quoteApprovals)
            .where(
              and(
                eq(quoteApprovals.quoteId, quoteId),
                eq(quoteApprovals.version, version),
                eq(quoteApprovals.status, "approved"),
              ),
            )
        : [];
      if (approved.length === 0) {
        status = "draft";
        held = true;
      }
    }

    if (quoteId) {
      await tx
        .update(quotes)
        .set({
          enquiryId: data.enquiryId ?? null,
          customerId: data.customerId,
          status,
          currency: data.currency,
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
          status,
          currency: data.currency,
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
        offerId: line.offerId ?? null,
      })),
    );

    if (held) {
      const [pending] = await tx
        .select({ id: quoteApprovals.id })
        .from(quoteApprovals)
        .where(
          and(
            eq(quoteApprovals.quoteId, quoteId!),
            eq(quoteApprovals.version, version),
            eq(quoteApprovals.status, "pending"),
          ),
        );
      const reason = approvalReason(
        data.lines.map((line) => ({
          quantity: line.quantity,
          cost: line.costPrice,
          sell: line.sellPrice,
        })),
        margin.percent,
      );
      if (pending) {
        await tx.update(quoteApprovals).set({ reason }).where(eq(quoteApprovals.id, pending.id));
      } else {
        await tx.insert(quoteApprovals).values({
          quoteId: quoteId!,
          version,
          status: "pending",
          reason,
          requestedBy: actor.userId,
        });
      }
    } else if (status === "sent" && flagged && actor.role === "admin") {
      await tx.insert(auditEvents).values({
        entityType: "quote",
        entityId: quoteId!,
        summary: `Admin sent version ${version} below the margin floor.`,
        actorId: actor.userId,
      });
    }

    const changes = priceChanges(previous, data, version);
    if (changes) {
      await tx.insert(auditEvents).values({
        entityType: "quote",
        entityId: quoteId!,
        summary: changes,
        actorId: actor.userId,
      });
    }

    for (const line of data.lines) {
      await rememberLastCost(tx, line, data.currency);
    }

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

    return { id: quoteId!, held };
  });

  if (!("id" in savedId)) return { error: savedId.error };

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${savedId.id}`);
  revalidatePath("/enquiries");
  revalidatePath("/approvals");
  revalidatePath("/products");
  revalidatePath("/");
  redirect(savedId.held ? `/quotes/${savedId.id}?notice=approval` : `/quotes/${savedId.id}`);
}

async function guardQuote() {
  try {
    const user = await requireRole("admin", "sales");
    return { user, error: null as string | null };
  } catch (error) {
    if (error instanceof AuthError) return { user: null, error: error.message };
    throw error;
  }
}

function lineFingerprint(
  lines: { description: string; quantity: string | number; costPrice: string | number; sellPrice: string | number }[],
) {
  return lines
    .map((line) => `${line.description}:${num(line.quantity)}:${num(line.costPrice)}:${num(line.sellPrice)}`)
    .sort()
    .join("|");
}

function priceChanges(
  previous:
    | {
        terms: string | null;
        currency: string;
        validUntil: Date | null;
        lines: {
          description: string;
          quantity: string;
          costPrice: string;
          sellPrice: string;
        }[];
      }
    | undefined,
  data: {
    terms?: string;
    currency: string;
    validUntil?: string;
    lines: { description: string; quantity: number; costPrice: number; sellPrice: number }[];
  },
  version: number,
) {
  if (!previous) return null;
  const parts: string[] = [];
  const before = lineFingerprint(previous.lines);
  const after = lineFingerprint(
    data.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      costPrice: line.costPrice,
      sellPrice: line.sellPrice,
    })),
  );
  if (before !== after) parts.push("prices or quantities changed");
  if ((previous.terms ?? "") !== (data.terms ?? "")) parts.push("terms changed");
  if (previous.currency !== data.currency) parts.push(`currency ${previous.currency} → ${data.currency}`);
  const nextValid = data.validUntil ? data.validUntil.slice(0, 10) : "";
  const oldValid = previous.validUntil ? previous.validUntil.toISOString().slice(0, 10) : "";
  if (oldValid !== nextValid) parts.push("validity changed");
  if (parts.length === 0) return null;
  return `Version ${version}: ${parts.join("; ")}.`;
}

async function rememberLastCost(
  tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  line: {
    description: string;
    brand?: string;
    unit: string;
    costPrice: number;
    supplierId?: string;
  },
  currency: string,
) {
  const brand = line.brand || null;
  const match = and(
    eq(productTemplates.name, line.description),
    eq(productTemplates.currency, currency),
    brand ? eq(productTemplates.brand, brand) : isNull(productTemplates.brand),
  );
  const [existing] = await tx
    .select({ id: productTemplates.id })
    .from(productTemplates)
    .where(match);
  if (existing) {
    await tx
      .update(productTemplates)
      .set({
        lastCost: moneyString(line.costPrice),
        unit: line.unit,
        supplierId: line.supplierId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(productTemplates.id, existing.id));
    return;
  }
  await tx.insert(productTemplates).values({
    name: line.description,
    brand,
    unit: line.unit,
    lastCost: moneyString(line.costPrice),
    currency,
    supplierId: line.supplierId ?? null,
  });
}
