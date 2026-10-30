"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createCustomerQuick, createSupplierQuick } from "@/actions/directory";
import { FormError, selectClassName } from "@/components/record-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CreatePartyState } from "@/lib/schemas";

export type PartyOption = { id: string; name: string };

type PartyKind = "customer" | "supplier";

const copy: Record<
  PartyKind,
  {
    label: string;
    placeholder: string;
    addLabel: string;
    sheetTitle: string;
    sheetDescription: string;
    action: (
      prev: CreatePartyState,
      formData: FormData,
    ) => Promise<CreatePartyState>;
  }
> = {
  customer: {
    label: "Customer",
    placeholder: "Choose a customer",
    addLabel: "Add customer",
    sheetTitle: "Add customer",
    sheetDescription: "Save them here and keep building the quote.",
    action: createCustomerQuick,
  },
  supplier: {
    label: "Supplier",
    placeholder: "Choose a supplier",
    addLabel: "Add supplier",
    sheetTitle: "Add supplier",
    sheetDescription: "Save them here and attach them to this line.",
    action: createSupplierQuick,
  },
};

export function PartySelect({
  kind,
  label,
  name,
  value,
  onChange,
  options,
  onCreated,
  required,
  id,
}: {
  kind: PartyKind;
  label?: string;
  name?: string;
  value: string;
  onChange: (id: string) => void;
  options: PartyOption[];
  onCreated: (party: PartyOption) => void;
  required?: boolean;
  id?: string;
}) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const meta = copy[kind];
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={selectId}>{label ?? meta.label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-amber-800 hover:bg-amber-50 hover:text-amber-950"
          onClick={() => setOpen(true)}
        >
          {meta.addLabel}
        </Button>
      </div>
      <select
        id={selectId}
        name={name}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClassName}
      >
        <option value="" disabled={required}>
          {meta.placeholder}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{meta.sheetTitle}</SheetTitle>
            <SheetDescription>{meta.sheetDescription}</SheetDescription>
          </SheetHeader>
          <QuickPartyForm
            key={String(open)}
            kind={kind}
            onCreated={(party) => {
              onCreated(party);
              onChange(party.id);
              setOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function QuickPartyForm({
  kind,
  onCreated,
}: {
  kind: PartyKind;
  onCreated: (party: PartyOption) => void;
}) {
  const meta = copy[kind];
  const [state, formAction, pending] = useActionState(meta.action, null);
  const onCreatedRef = useRef(onCreated);
  onCreatedRef.current = onCreated;

  useEffect(() => {
    if (state && "id" in state) {
      onCreatedRef.current({ id: state.id, name: state.name });
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-4 px-4 pb-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <div className="space-y-1.5">
        <Label htmlFor="quick-name">Name</Label>
        <Input id="quick-name" name="name" required autoFocus />
      </div>
      {kind === "customer" ? (
        <div className="space-y-1.5">
          <Label htmlFor="quick-company">Company</Label>
          <Input id="quick-company" name="company" />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="quick-contact">Contact person</Label>
        <Input id="quick-contact" name="contactPerson" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="quick-email">Email</Label>
        <Input id="quick-email" name="email" type="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="quick-phone">Phone</Label>
        <Input id="quick-phone" name="phone" />
      </div>
      <SheetFooter className="mt-auto px-0">
        <Button
          type="submit"
          disabled={pending}
          className="min-h-11 bg-slate-950 text-white hover:bg-slate-800"
        >
          {pending ? "Saving…" : meta.addLabel}
        </Button>
      </SheetFooter>
    </form>
  );
}
