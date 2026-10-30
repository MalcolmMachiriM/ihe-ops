"use server";

import { Resend } from "resend";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { documentShares } from "@/db/schema";
import { guardRole } from "@/lib/auth";
import { field } from "@/lib/schemas";
import { buildSharePdf, type ShareKind } from "@/lib/share-pdf";

export type ShareState = { error?: string; url?: string; sent?: boolean } | null;

const kinds = ["quote", "invoice", "receipt"] as const;
const defaultFrom = "Infinite Hardware & Electrical <sales@ihe.co.zw>";
const staffCc = "ihardware19@gmail.com";

export async function sendDocumentLink(
  _prev: ShareState,
  formData: FormData,
): Promise<ShareState> {
  const denied = await guardRole("admin", "sales", "accounts");
  if (denied) return denied;

  const kind = field(formData, "kind");
  const documentId = field(formData, "documentId");
  const email = field(formData, "email");
  if (!kinds.includes(kind as (typeof kinds)[number])) {
    return { error: "Choose a document to share." };
  }
  if (!documentId) return { error: "Document is missing." };

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await getDb().insert(documentShares).values({
    token,
    kind,
    documentId,
    expiresAt,
  });

  const url = `${await appOrigin()}/share/${token}`;
  if (!email) return { url };

  if (!process.env.RESEND_API_KEY) {
    return { url, error: "The link is ready. Add RESEND_API_KEY before email can send." };
  }

  try {
    const pdf = await buildSharePdf(kind as ShareKind, documentId);
    if (!pdf) {
      return { url, error: "The link is ready, but the PDF could not be built for email." };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM || defaultFrom,
      to: email,
      cc: staffCc,
      subject: `Your ${kind} from Infinite Hardware & Electrical`,
      text: `Please find your ${kind} attached. You can also view it online: ${url}`,
      attachments: [
        {
          filename: pdf.filename,
          content: pdf.buffer.toString("base64"),
        },
      ],
    });
  } catch {
    return { url, error: "The link is ready, but the email did not send." };
  }

  return { url, sent: true };
}

async function appOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const headerList = await headers();
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const host = headerList.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
