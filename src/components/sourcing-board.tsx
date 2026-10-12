"use client";

import { useActionState } from "react";
import {
  addSourcingItem,
  addSupplierOffer,
  attachSupplierReply,
  chooseOffer,
  createPurchaseOrders,
  createQuoteFromWinners,
  saveSupplierRfq,
} from "@/actions/sourcing";
import { FormError, selectClassName } from "@/components/record-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney, num } from "@/lib/format";
import type { ActionState } from "@/lib/schemas";

type Offer = {
  id: string;
  supplierId: string;
  supplierName: string;
  brand: string | null;
  costPrice: string;
  leadTimeDays: number | null;
  chosen: boolean;
};

type Item = {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  offers: Offer[];
};

type Rfq = {
  id: string;
  supplierId: string;
  supplierName: string;
  notes: string | null;
  replyNotes: string | null;
  files: { id: string; fileName: string }[];
};

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function SourcingBoard({
  enquiryId,
  suppliers,
  items,
  rfqs,
  canEdit,
}: {
  enquiryId: string;
  suppliers: { id: string; name: string }[];
  items: Item[];
  rfqs: Rfq[];
  canEdit: boolean;
}) {
  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-slate-950">Supplier compare</h2>
        <p className="mt-1 text-sm text-slate-600">
          Record each supplier&apos;s price, brand, and lead time. Choose one winner per line, then build the client quote.
        </p>
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const costs = item.offers.map((offer) => num(offer.costPrice));
            const lowest = costs.length > 0 ? Math.min(...costs) : 0;
            return (
              <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-medium text-slate-900">
                  {item.description}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    {num(item.quantity)} {item.unit}
                  </span>
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {item.offers.map((offer) => {
                    const isLowest = item.offers.length > 1 && num(offer.costPrice) === lowest;
                    return (
                      <div
                        key={offer.id}
                        className={
                          offer.chosen
                            ? "rounded-lg border border-emerald-300 bg-emerald-50 p-3"
                            : "rounded-lg border border-slate-200 p-3"
                        }
                      >
                        <p className="font-medium">{offer.supplierName}</p>
                        <p className="text-sm text-slate-600">{offer.brand || "No brand"}</p>
                        <p className="mt-2 text-sm">
                          {formatMoney(offer.costPrice)} · {offer.leadTimeDays ?? "—"}d
                          {isLowest ? " · lowest" : ""}
                        </p>
                        {offer.chosen ? <p className="mt-1 text-xs font-medium text-emerald-800">Winning line</p> : null}
                        {canEdit && !offer.chosen ? (
                          <MiniForm action={chooseOffer} label="Choose">
                            <input type="hidden" name="enquiryId" value={enquiryId} />
                            <input type="hidden" name="offerId" value={offer.id} />
                            <input type="hidden" name="sourcingItemId" value={item.id} />
                          </MiniForm>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {canEdit ? (
                  <OfferForm enquiryId={enquiryId} itemId={item.id} suppliers={suppliers} />
                ) : null}
              </div>
            );
          })}
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">No lines to compare yet.</p>
          ) : null}
        </div>
        {canEdit ? <ItemForm enquiryId={enquiryId} /> : null}
        {canEdit && items.length > 0 ? <GenerateForm enquiryId={enquiryId} /> : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-slate-950">Supplier requests</h2>
        <p className="mt-1 text-sm text-slate-600">
          Internal notes and the supplier&apos;s reply. Attach a PDF or photo of their quote.
        </p>
        <div className="mt-4 space-y-4">
          {rfqs.map((rfq) => (
            <div key={rfq.id} className="rounded-lg border border-slate-200 p-4 text-sm">
              <p className="font-medium">{rfq.supplierName}</p>
              <p className="mt-2 whitespace-pre-wrap text-slate-600">{rfq.notes || "No internal notes."}</p>
              <p className="mt-2 whitespace-pre-wrap text-slate-800">{rfq.replyNotes || "No supplier reply yet."}</p>
              <ul className="mt-2 space-y-1">
                {rfq.files.map((file) => (
                  <li key={file.id}>
                    <a className="text-amber-700 hover:underline" href={`/enquiries/${enquiryId}/files/${file.id}`}>
                      {file.fileName}
                    </a>
                  </li>
                ))}
              </ul>
              {canEdit ? (
                <MiniForm action={attachSupplierReply} label="Attach reply">
                  <input type="hidden" name="enquiryId" value={enquiryId} />
                  <input type="hidden" name="rfqId" value={rfq.id} />
                  <Input name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" />
                </MiniForm>
              ) : null}
            </div>
          ))}
        </div>
        {canEdit ? <RfqForm enquiryId={enquiryId} suppliers={suppliers} /> : null}
      </section>
    </div>
  );
}

export function PurchaseOrderButton({ quoteId }: { quoteId: string }) {
  const [state, formAction, pending] = useActionState(createPurchaseOrders, null);
  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state?.error} />
      <input type="hidden" name="quoteId" value={quoteId} />
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? "Creating…" : "Create supplier purchase orders"}
      </Button>
    </form>
  );
}

export function QuoteReasons({
  lines,
  items,
}: {
  lines: { id: string; description: string; supplierName: string | null; offerId: string | null; costPrice: string; leadTimeDays: number | null }[];
  items: Item[];
}) {
  const explained = lines.filter((line) => line.offerId);
  if (explained.length === 0) return null;

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-[family-name:var(--font-display)] text-2xl">Why this quote</h2>
      <ul className="mt-3 space-y-3 text-sm text-slate-700">
        {explained.map((line) => {
          const item = items.find((candidate) => candidate.offers.some((offer) => offer.id === line.offerId));
          const others = item?.offers.filter((offer) => offer.id !== line.offerId) ?? [];
          return (
            <li key={line.id}>
              <span className="font-medium text-slate-950">{line.description}</span> from {line.supplierName ?? "the chosen supplier"} at {formatMoney(line.costPrice)}
              {line.leadTimeDays != null ? `, ${line.leadTimeDays}d lead` : ""}.
              {others.length > 0 ? (
                <span>
                  {" "}
                  Not chosen:{" "}
                  {others
                    .map((offer) => `${offer.supplierName} ${formatMoney(offer.costPrice)}${offer.leadTimeDays != null ? ` · ${offer.leadTimeDays}d` : ""}`)
                    .join("; ")}
                  .
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ItemForm({ enquiryId }: { enquiryId: string }) {
  return (
    <ActionForm action={addSourcingItem} label="Add line" className="mt-4 grid gap-3 sm:grid-cols-4">
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <Field label="Item" name="description" />
      <Field label="Qty" name="quantity" type="number" defaultValue="1" />
      <Field label="Unit" name="unit" defaultValue="ea" />
    </ActionForm>
  );
}

function OfferForm({
  enquiryId,
  itemId,
  suppliers,
}: {
  enquiryId: string;
  itemId: string;
  suppliers: { id: string; name: string }[];
}) {
  return (
    <ActionForm action={addSupplierOffer} label="Add offer" className="mt-3 grid gap-3 md:grid-cols-5">
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <input type="hidden" name="sourcingItemId" value={itemId} />
      <div className="space-y-1.5">
        <Label>Supplier</Label>
        <select name="supplierId" className={selectClassName} defaultValue="">
          <option value="" disabled>
            Supplier
          </option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>
      <Field label="Brand" name="brand" />
      <Field label="Cost" name="costPrice" type="number" />
      <Field label="Lead days" name="leadTimeDays" type="number" />
    </ActionForm>
  );
}

function GenerateForm({ enquiryId }: { enquiryId: string }) {
  return (
    <ActionForm action={createQuoteFromWinners} label="Create quote from winners" className="mt-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <Field label="Markup %" name="markup" type="number" defaultValue="30" />
    </ActionForm>
  );
}

function RfqForm({
  enquiryId,
  suppliers,
}: {
  enquiryId: string;
  suppliers: { id: string; name: string }[];
}) {
  return (
    <ActionForm action={saveSupplierRfq} label="Save supplier request" className="mt-4 grid gap-3">
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <div className="space-y-1.5">
        <Label>Supplier</Label>
        <select name="supplierId" className={selectClassName} defaultValue="">
          <option value="" disabled>
            Supplier
          </option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Internal notes</Label>
        <Textarea name="notes" rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label>Supplier reply</Label>
        <Textarea name="replyNotes" rows={3} />
      </div>
    </ActionForm>
  );
}

function ActionForm({
  action,
  label,
  className,
  children,
}: {
  action: FormAction;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state?.error} />
      <div className={className}>{children}</div>
      <Button type="submit" disabled={pending} className="bg-slate-950 text-white hover:bg-slate-800">
        {pending ? "Saving…" : label}
      </Button>
    </form>
  );
}

function MiniForm({
  action,
  label,
  children,
}: {
  action: FormAction;
  label: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="mt-3 space-y-2">
      <FormError message={state?.error} />
      {children}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Saving…" : label}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} step={type === "number" ? "0.01" : undefined} defaultValue={defaultValue} />
    </div>
  );
}
