"use client";

import { useActionState } from "react";
import { acceptSharedQuote } from "@/actions/approvals";
import { FormError } from "@/components/record-forms";
import { Button } from "@/components/ui/button";

export function AcceptQuoteButton({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptSharedQuote, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state?.accepted ? null : (
        <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
          {pending ? "Accepting…" : "Accept quote"}
        </Button>
      )}
      <FormError message={state?.error} />
      {state?.accepted ? (
        <p className="text-sm text-emerald-800">This quote is accepted. IHE will confirm the order.</p>
      ) : null}
    </form>
  );
}
