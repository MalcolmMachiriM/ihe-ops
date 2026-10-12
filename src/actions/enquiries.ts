"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { enquiries } from "@/db/schema";
import { guardRole, requireUser } from "@/lib/auth";
import { nextDocumentNumber } from "@/lib/numbers";
import {
  type ActionState,
  enquirySchema,
  field,
  optionalId,
  zodError,
} from "@/lib/schemas";

export async function saveEnquiry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await guardRole("admin", "sales");
  if (denied) return denied;
  const user = await requireUser();

  const parsed = enquirySchema.safeParse({
    id: optionalId(field(formData, "id")),
    customerId: field(formData, "customerId"),
    title: field(formData, "title"),
    description: field(formData, "description"),
    source: field(formData, "source") || "phone",
    urgency: field(formData, "urgency") || "normal",
    status: field(formData, "status") || "new",
    neededBy: field(formData, "neededBy"),
  });
  if (!parsed.success) return { error: zodError(parsed.error) };

  const data = parsed.data;
  const neededBy = data.neededBy ? new Date(data.neededBy) : null;
  const db = getDb();

  if (data.id) {
    await db
      .update(enquiries)
      .set({
        customerId: data.customerId,
        title: data.title,
        description: data.description || null,
        source: data.source,
        urgency: data.urgency,
        status: data.status,
        neededBy,
        updatedAt: new Date(),
      })
      .where(eq(enquiries.id, data.id));
    revalidatePath("/enquiries");
    revalidatePath(`/enquiries/${data.id}`);
    revalidatePath("/");
    redirect(`/enquiries/${data.id}`);
  }

  const reference = await nextDocumentNumber(db, "ENQ");
  const [created] = await db
    .insert(enquiries)
    .values({
      reference,
      customerId: data.customerId,
      title: data.title,
      description: data.description || null,
      source: data.source,
      urgency: data.urgency,
      status: "new",
      neededBy,
      assignedTo: user.userId,
    })
    .returning({ id: enquiries.id });

  revalidatePath("/enquiries");
  revalidatePath("/");
  redirect(`/enquiries/${created.id}`);
}
