"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveCustomer, saveSupplier } from "@/actions/directory";
import { saveEnquiry } from "@/actions/enquiries";
import { createInvoice, createProforma, issueCreditNote, recordPayment } from "@/actions/invoices";
import { toDateInput } from "@/lib/format";
import type { ActionState } from "@/lib/schemas";

export const selectClassName =
  "h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type FormAction = (
  state: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
      {message}
    </p>
  );
}

function BoundForm({
  action,
  submitLabel,
  children,
}: {
  action: FormAction;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.error} />
      {children}
      <Button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-slate-950 text-white hover:bg-slate-800"
      >
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

type PartyDefaults = {
  id?: string;
  name?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  categories?: string | null;
  notes?: string | null;
};

export function CustomerForm({ defaults }: { defaults?: PartyDefaults }) {
  return (
    <BoundForm action={saveCustomer} submitLabel={defaults?.id ? "Save customer" : "Add customer"}>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <Field label="Name" name="name" defaultValue={defaults?.name} required />
      <Field label="Contact person" name="contactPerson" defaultValue={defaults?.contactPerson} />
      <Field label="Company" name="company" defaultValue={defaults?.company} />
      <Field label="Email" name="email" type="email" defaultValue={defaults?.email} />
      <Field label="Phone" name="phone" defaultValue={defaults?.phone} />
      <Field label="Address" name="address" defaultValue={defaults?.address} multiline />
      <Field label="Notes" name="notes" defaultValue={defaults?.notes} multiline />
    </BoundForm>
  );
}

export function SupplierForm({ defaults }: { defaults?: PartyDefaults }) {
  return (
    <BoundForm action={saveSupplier} submitLabel={defaults?.id ? "Save supplier" : "Add supplier"}>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <Field label="Name" name="name" defaultValue={defaults?.name} required />
      <Field label="Contact person" name="contactPerson" defaultValue={defaults?.contactPerson} />
      <Field label="Email" name="email" type="email" defaultValue={defaults?.email} />
      <Field label="Phone" name="phone" defaultValue={defaults?.phone} />
      <Field label="Categories" name="categories" defaultValue={defaults?.categories} />
      <Field label="Notes" name="notes" defaultValue={defaults?.notes} multiline />
    </BoundForm>
  );
}

type EnquiryDefaults = {
  id?: string;
  customerId?: string;
  title?: string | null;
  description?: string | null;
  source?: string | null;
  urgency?: string | null;
  status?: string | null;
  neededBy?: Date | string | null;
};

export function EnquiryForm({
  customers,
  defaults,
}: {
  customers: { id: string; name: string }[];
  defaults?: EnquiryDefaults;
}) {
  return (
    <BoundForm action={saveEnquiry} submitLabel={defaults?.id ? "Save enquiry" : "Create enquiry"}>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <div className="space-y-1.5">
        <Label htmlFor="customerId">Customer</Label>
        <select
          id="customerId"
          name="customerId"
          required
          defaultValue={defaults?.customerId ?? ""}
          className={selectClassName}
        >
          <option value="" disabled>
            Choose a customer
          </option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>
      <Field label="Title" name="title" defaultValue={defaults?.title} required />
      <Field label="Specs" name="description" defaultValue={defaults?.description} multiline />
      <div className="grid gap-4 sm:grid-cols-3">
        <Choice
          label="Source"
          name="source"
          defaultValue={defaults?.source ?? "phone"}
          options={[
            ["whatsapp", "WhatsApp"],
            ["phone", "Phone"],
            ["email", "Email"],
            ["website", "Website"],
          ]}
        />
        <Choice
          label="Urgency"
          name="urgency"
          defaultValue={defaults?.urgency ?? "normal"}
          options={[
            ["low", "Low"],
            ["normal", "Normal"],
            ["high", "High"],
          ]}
        />
        {defaults?.id ? (
          <Choice
            label="Status"
            name="status"
            defaultValue={defaults.status ?? "new"}
            options={[
              ["new", "New"],
              ["sourcing", "Sourcing"],
              ["quoted", "Quoted"],
              ["won", "Won"],
              ["lost", "Lost"],
              ["expired", "Expired"],
            ]}
          />
        ) : (
          <input type="hidden" name="status" value="new" />
        )}
      </div>
      <Field
        label="Needed by"
        name="neededBy"
        type="date"
        defaultValue={toDateInput(defaults?.neededBy)}
      />
    </BoundForm>
  );
}

export function PaymentForm({
  invoiceId,
  currency,
  balance,
  deposit,
}: {
  invoiceId: string;
  currency: string;
  balance: number;
  deposit?: boolean;
}) {
  return (
    <BoundForm
      action={recordPayment}
      submitLabel={deposit ? "Record deposit and issue receipt" : "Record payment and issue receipt"}
    >
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <p className="text-sm text-slate-600">
        Balance due: {balance.toFixed(2)} {currency}
      </p>
      <Field label="Amount" name="amount" type="number" step="0.01" min="0.01" required />
      <Choice
        label="Method"
        name="method"
        defaultValue="bank_transfer"
        options={[
          ["cash", "Cash"],
          ["ecocash", "EcoCash"],
          ["bank_transfer", "Bank transfer"],
          ["swipe", "Swipe"],
        ]}
      />
      <Field label="Reference" name="reference" />
      <Field label="Paid on" name="paidAt" type="date" defaultValue={toDateInput(new Date())} required />
    </BoundForm>
  );
}

export function CreditForm({ invoiceId, currency, balance }: { invoiceId: string; currency: string; balance: number }) {
  return (
    <BoundForm action={issueCreditNote} submitLabel="Issue credit note">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <p className="text-sm text-slate-600">
        Remaining balance: {balance.toFixed(2)} {currency}
      </p>
      <Field label="Amount" name="amount" type="number" step="0.01" min="0.01" required />
      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason</Label>
        <Textarea id="reason" name="reason" required />
      </div>
    </BoundForm>
  );
}

export function ConvertQuoteButtons({
  quoteId,
  canProforma,
  canInvoice,
}: {
  quoteId: string;
  canProforma: boolean;
  canInvoice: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {canProforma ? (
        <ConvertButton action={createProforma} quoteId={quoteId} label="Create proforma" />
      ) : null}
      {canInvoice ? (
        <ConvertButton action={createInvoice} quoteId={quoteId} label="Create invoice" />
      ) : null}
    </div>
  );
}

function ConvertButton({
  action,
  quoteId,
  label,
}: {
  action: FormAction;
  quoteId: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction}>
      <input type="hidden" name="quoteId" value={quoteId} />
      <FormError message={state?.error} />
      <Button
        type="submit"
        disabled={pending}
        variant="outline"
        className="mt-2"
      >
        {pending ? "Working…" : label}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  multiline,
  step,
  min,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  step?: string;
  min?: string;
}) {
  const id = name;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea id={id} name={name} defaultValue={defaultValue ?? ""} rows={4} />
      ) : (
        <Input
          id={id}
          name={name}
          type={type}
          required={required}
          step={step}
          min={min}
          defaultValue={defaultValue ?? ""}
        />
      )}
    </div>
  );
}

function Choice({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: [string, string][];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select id={name} name={name} defaultValue={defaultValue} className={selectClassName}>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}
