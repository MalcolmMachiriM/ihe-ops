"use server";

import { and, eq, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { auditEvents, documentShares, enquiries, quoteApprovals, quotes } from "@/db/schema";
import { AuthError, requireRole } from "@/lib/auth";
import { field } from "@/lib/schemas";

export async function decideApproval(formData: FormData) {
  let user;
  try {
    user = await requireRole("admin");
  } catch (error) {
    if (error instanceof AuthError) throw new Error(error.message);
    throw error;
  }

  const id = field(formData, "id");
  const decision = field(formData, "decision");
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Choose approve or reject.");
  }

  const db = getDb();
  const [approval] = await db.select().from(quoteApprovals).where(eq(quoteApprovals.id, id));
  if (!approval || approval.status !== "pending") {
    throw new Error("This request is already decided.");
  }

  await db
    .update(quoteApprovals)
    .set({
      status: decision,
      decidedBy: user.userId,
      decidedAt: new Date(),
    })
    .where(eq(quoteApprovals.id, id));

  await db.insert(auditEvents).values({
    entityType: "quote",
    entityId: approval.quoteId,
    summary: `Version ${approval.version} ${decision === "approved" ? "approved" : "rejected"} for send.`,
    actorId: user.userId,
  });

  revalidatePath("/approvals");
  revalidatePath(`/quotes/${approval.quoteId}`);
  redirect("/approvals");
}

export async function acceptSharedQuote(
  _prev: { error?: string; accepted?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; accepted?: boolean } | null> {
  const token = field(formData, "token");
  const db = getDb();
  const [share] = await db
    .select()
    .from(documentShares)
    .where(and(eq(documentShares.token, token), gt(documentShares.expiresAt, new Date())));
  if (!share || share.kind !== "quote") return { error: "This link is no longer valid." };

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, share.documentId));
  if (!quote) return { error: "This quote is no longer available." };
  if (quote.status === "accepted") return { accepted: true };
  if (quote.status !== "sent") return { error: "This quote cannot be accepted from the link." };

  await db
    .update(quotes)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(quotes.id, quote.id));
  if (quote.enquiryId) {
    await db
      .update(enquiries)
      .set({ status: "won", updatedAt: new Date() })
      .where(eq(enquiries.id, quote.enquiryId));
  }
  await db.insert(auditEvents).values({
    entityType: "quote",
    entityId: quote.id,
    summary: "Client accepted the quote from the share link.",
    actorId: "client",
  });

  revalidatePath(`/quotes/${quote.id}`);
  revalidatePath("/enquiries");
  return { accepted: true };
}
