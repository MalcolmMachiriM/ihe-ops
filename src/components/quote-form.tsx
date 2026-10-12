"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { saveQuote } from "@/actions/quotes";
import { FormError, selectClassName } from "@/components/record-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney, num, toDateInput } from "@/lib/format";
import { lineMargin, quoteMargin } from "@/lib/margin";

type LineState = {
  key: string;
  description: string;
  brand: string;
  quantity: string;
  unit: string;
  supplierId: string;
  costPrice: string;
  markupPercent: string;
  sellPrice: string;
  leadTimeDays: string;
};

type QuoteDefaults = {
  id?: string;
  enquiryId?: string | null;
  customerId?: string;
  status?: string;
  currency?: string;
  validUntil?: Date | string | null;
  notes?: string | null;
  terms?: string | null;
  version?: number;
  lines?: {
    description: string;
    brand: string | null;
    quantity: string;
    unit: string;
    supplierId: string | null;
    costPrice: string;
    sellPrice: string;
    leadTimeDays: number | null;
  }[];
};

const emptyLine = (key: string): LineState => ({
  key,
  description: "",
  brand: "",
  quantity: "1",
  unit: "ea",
  supplierId: "",
  costPrice: "0",
  markupPercent: "30",
  sellPrice: "0.00",
  leadTimeDays: "",
});

function fromDefaults(defaults?: QuoteDefaults): LineState[] {
  if (!defaults?.lines?.length) return [emptyLine("line-0")];
  return defaults.lines.map((line, index) => {
    const cost = num(line.costPrice);
    const sell = num(line.sellPrice);
    const markup = cost > 0 ? ((sell - cost) / cost) * 100 : 0;
    return {
      key: `line-${index}`,
      description: line.description,
      brand: line.brand ?? "",
      quantity: String(num(line.quantity)),
      unit: line.unit,
      supplierId: line.supplierId ?? "",
      costPrice: String(cost),
      markupPercent: markup.toFixed(2),
      sellPrice: sell.toFixed(2),
      leadTimeDays: line.leadTimeDays == null ? "" : String(line.leadTimeDays),
    };
  });
}

export function QuoteForm({
  customers,
  suppliers,
  enquiries,
  defaults,
}: {
  customers: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  enquiries: { id: string; reference: string; title: string; customerId: string }[];
  defaults?: QuoteDefaults;
}) {
  const [state, formAction, pending] = useActionState(saveQuote, null);
  const [customerId, setCustomerId] = useState(defaults?.customerId ?? "");
  const [enquiryId, setEnquiryId] = useState(defaults?.enquiryId ?? "");
  const [currency, setCurrency] = useState(defaults?.currency ?? "USD");
  const [lines, setLines] = useState<LineState[]>(() => fromDefaults(defaults));

  const totals = useMemo(() => {
    return quoteMargin(
      lines.map((line) => ({
        quantity: num(line.quantity),
        cost: num(line.costPrice),
        sell: num(line.sellPrice),
      })),
    );
  }, [lines]);

  function updateLine(key: string, patch: Partial<LineState>, source: "markup" | "sell" | "other") {
    setLines((current) =>
      current.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...patch };
        const cost = num(next.costPrice);
        if (source === "sell") {
          const sell = num(next.sellPrice);
          next.markupPercent = cost > 0 ? (((sell - cost) / cost) * 100).toFixed(2) : "0";
        } else if (source === "markup") {
          const markup = num(next.markupPercent);
          next.sellPrice = (cost * (1 + markup / 100)).toFixed(2);
        }
        return next;
      }),
    );
  }

  const payload = lines.map((line) => ({
    description: line.description,
    brand: line.brand,
    quantity: num(line.quantity),
    unit: line.unit || "ea",
    supplierId: line.supplierId,
    costPrice: num(line.costPrice),
    sellPrice: num(line.sellPrice),
    leadTimeDays: line.leadTimeDays === "" ? null : Number(line.leadTimeDays),
  }));

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state?.error} />
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <input type="hidden" name="lines" value={JSON.stringify(payload)} />
      {defaults?.version ? (
        <p className="text-sm text-slate-500">Version {defaults.version}. Saving a sent quote starts the next version.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="enquiryId">Enquiry</Label>
          <select
            id="enquiryId"
            name="enquiryId"
            value={enquiryId}
            onChange={(event) => {
              const nextId = event.target.value;
              setEnquiryId(nextId);
              const enquiry = enquiries.find((item) => item.id === nextId);
              if (enquiry) setCustomerId(enquiry.customerId);
            }}
            className={selectClassName}
          >
            <option value="">No enquiry</option>
            {enquiries.map((enquiry) => (
              <option key={enquiry.id} value={enquiry.id}>
                {enquiry.reference} · {enquiry.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customerId">Customer</Label>
          <select
            id="customerId"
            name="customerId"
            required
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
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
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue={defaults?.status ?? "draft"} className={selectClassName}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            name="currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            maxLength={8}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="validUntil">Valid until</Label>
          <Input
            id="validUntil"
            name="validUntil"
            type="date"
            defaultValue={toDateInput(defaults?.validUntil)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {lines.map((line, index) => {
          const margin = lineMargin(num(line.quantity), num(line.costPrice), num(line.sellPrice));
          return (
            <div key={line.key} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Line {index + 1}</p>
                {lines.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={line.description}
                    onChange={(event) => updateLine(line.key, { description: event.target.value }, "other")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Brand</Label>
                  <Input
                    value={line.brand}
                    onChange={(event) => updateLine(line.key, { brand: event.target.value }, "other")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Supplier</Label>
                  <select
                    value={line.supplierId}
                    onChange={(event) => updateLine(line.key, { supplierId: event.target.value }, "other")}
                    className={selectClassName}
                  >
                    <option value="">Choose a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={line.quantity}
                    onChange={(event) => updateLine(line.key, { quantity: event.target.value }, "other")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <Input
                    value={line.unit}
                    onChange={(event) => updateLine(line.key, { unit: event.target.value }, "other")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cost</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.costPrice}
                    onChange={(event) => updateLine(line.key, { costPrice: event.target.value }, "markup")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Markup %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={line.markupPercent}
                    onChange={(event) => updateLine(line.key, { markupPercent: event.target.value }, "markup")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sell</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.sellPrice}
                    onChange={(event) => updateLine(line.key, { sellPrice: event.target.value }, "sell")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Lead time (days)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={line.leadTimeDays}
                    onChange={(event) => updateLine(line.key, { leadTimeDays: event.target.value }, "other")}
                  />
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Margin {formatMoney(margin.value, currency)} ({margin.percent.toFixed(1)}%)
              </p>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setLines((current) => [...current, emptyLine(`line-${Date.now()}`)])
        }
      >
        Add line
      </Button>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p>Quote total {formatMoney(totals.sell, currency)}. Tax is 0 in this phase.</p>
        <p className="mt-1">
          Margin {formatMoney(totals.value, currency)} ({totals.percent.toFixed(1)}% of sell) before you send.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={defaults?.notes ?? ""} rows={3} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="terms">Terms</Label>
          <Textarea id="terms" name="terms" defaultValue={defaults?.terms ?? ""} rows={3} />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="bg-slate-950 text-white hover:bg-slate-800">
        {pending ? "Saving…" : "Save quote"}
      </Button>
    </form>
  );
}
