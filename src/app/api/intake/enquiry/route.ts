import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { customers, enquiries } from "@/db/schema";
import { nextDocumentNumber } from "@/lib/numbers";

const intakeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  title: z.string().trim().optional().default(""),
  message: z.string().trim().min(1, "Message is required"),
});

export async function POST(request: Request) {
  const expected = process.env.INTAKE_API_KEY;
  if (!expected) {
    return NextResponse.json(
      { error: "Intake is not configured" },
      { status: 503 },
    );
  }

  const provided = request.headers.get("x-api-key");
  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = intakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const { name, email, title, message } = parsed.data;
  const cleanEmail = email.toLowerCase();
  const enquiryTitle =
    title ||
    (message.length > 80 ? `${message.slice(0, 77)}…` : message) ||
    "Website enquiry";

  try {
    const db = getDb();

    const [existing] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(sql`lower(${customers.email}) = ${cleanEmail}`)
      .limit(1);

    let customerId = existing?.id;
    if (!customerId) {
      const [created] = await db
        .insert(customers)
        .values({
          name,
          email: cleanEmail,
          contactPerson: name,
        })
        .returning({ id: customers.id });
      customerId = created.id;
    }

    const reference = await nextDocumentNumber(db, "ENQ");
    const [enquiry] = await db
      .insert(enquiries)
      .values({
        reference,
        customerId,
        title: enquiryTitle,
        description: message,
        source: "website",
        status: "new",
        urgency: "normal",
      })
      .returning({ id: enquiries.id });

    return NextResponse.json({
      reference,
      enquiryId: enquiry.id,
      customerId,
    });
  } catch (err) {
    console.error("Intake enquiry error:", err);
    return NextResponse.json(
      { error: "Failed to create enquiry" },
      { status: 500 },
    );
  }
}
