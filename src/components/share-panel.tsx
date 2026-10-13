"use client";

import { useActionState } from "react";
import { sendDocumentLink } from "@/actions/shares";
import { FormError } from "@/components/record-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SharePanel({
  kind,
  documentId,
  email,
}: {
  kind: "quote" | "invoice" | "receipt";
  documentId: string;
  email?: string | null;
}) {
  const [state, action, pending] = useActionState(sendDocumentLink, null);
  const whatsapp = state?.url
    ? `https://wa.me/?text=${encodeURIComponent(`Here is your ${kind}: ${state.url}`)}`
    : null;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="documentId" value={documentId} />
      <div className="space-y-1.5">
        <Label htmlFor={`${kind}-email`}>Email a link</Label>
        <Input id={`${kind}-email`} name="email" type="email" defaultValue={email ?? ""} placeholder="Leave blank to only create a link" />
      </div>
      <Button type="submit" disabled={pending} className="min-h-11">
        {pending ? "Sending…" : "Create link"}
      </Button>
      <FormError message={state?.error} />
      {state?.url ? (
        <div className="space-y-2 text-sm">
          <p className="break-all text-slate-700">{state.url}</p>
          {whatsapp ? (
            <a href={whatsapp} className="inline-flex min-h-11 items-center text-amber-700 hover:underline" target="_blank" rel="noreferrer">
              Share on WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
