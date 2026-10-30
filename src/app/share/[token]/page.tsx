import Link from "next/link";
import { notFound } from "next/navigation";
import { AcceptQuoteButton } from "@/components/accept-quote";
import { getInvoice, getQuote, getReceipt, getShare } from "@/db/queries";
import { brand } from "@/lib/brand";
import { formatDate, formatMoney, num } from "@/lib/format";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const share = await getShare(token);
  if (!share) notFound();

  if (share.kind === "quote") {
    const quote = await getQuote(share.documentId);
    if (!quote) notFound();
    return (
      <ShareShell title={quote.number} subtitle={`${quote.customerName} · valid ${formatDate(quote.validUntil)}`}>
        <LineList
          currency={quote.currency}
          lines={quote.lines}
          total={quote.total}
        />
        {quote.terms ? <p className="mt-4 text-sm text-slate-600">{quote.terms}</p> : null}
        <div className="mt-6">
          {quote.status === "accepted" ? (
            <p className="text-sm text-emerald-800">This quote is accepted.</p>
          ) : quote.status === "sent" ? (
            <AcceptQuoteButton token={token} />
          ) : (
            <p className="text-sm text-slate-600">This quote is not open for acceptance.</p>
          )}
        </div>
        <PdfSection token={token} />
      </ShareShell>
    );
  }

  if (share.kind === "invoice") {
    const invoice = await getInvoice(share.documentId);
    if (!invoice) notFound();
    return (
      <ShareShell title={invoice.number} subtitle={`${invoice.customerName} · due ${formatDate(invoice.dueDate)}`}>
        <LineList currency={invoice.currency} lines={invoice.lines} total={invoice.total} />
        <p className="mt-4 text-sm">Balance {formatMoney(invoice.balance, invoice.currency)}</p>
        <PdfSection token={token} />
      </ShareShell>
    );
  }

  const receipt = await getReceipt(share.documentId);
  if (!receipt || share.kind !== "receipt") notFound();
  return (
    <ShareShell title={receipt.number} subtitle={receipt.customerName}>
      <p className="text-lg">{formatMoney(receipt.amount, receipt.currency)}</p>
      <p className="mt-2 text-sm text-slate-600">
        {formatDate(receipt.issuedAt)} · {receipt.invoiceNumber}
      </p>
      <PdfSection token={token} />
    </ShareShell>
  );
}

function ShareShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <p className="text-xs uppercase tracking-[0.16em] text-amber-700">{brand.company}</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-slate-950">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      <p className="mt-3 text-sm text-slate-500">
        {brand.address}
        <span className="mx-2 text-slate-300">·</span>
        {brand.phones.join(" · ")}
        <span className="mx-2 text-slate-300">·</span>
        <a href={`mailto:${brand.email}`} className="text-amber-700 hover:underline">
          {brand.email}
        </a>
      </p>
      <div className="mt-6">{children}</div>
    </main>
  );
}

function LineList({
  lines,
  currency,
  total,
}: {
  lines: { description: string; quantity: string | number; unit: string; sellPrice: string | number }[];
  currency: string;
  total: string | number;
}) {
  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {lines.map((line) => (
        <div key={line.description} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-slate-900">{line.description}</p>
            <p className="text-slate-500">
              {num(line.quantity)} {line.unit}
            </p>
          </div>
          <p>{formatMoney(num(line.quantity) * num(line.sellPrice), currency)}</p>
        </div>
      ))}
      <div className="flex justify-between px-4 py-3 text-sm font-medium">
        <span>Total</span>
        <span>{formatMoney(total, currency)}</span>
      </div>
    </div>
  );
}

function PdfSection({ token }: { token: string }) {
  const href = `/share/${token}/pdf`;
  return (
    <div className="mt-8 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-slate-900">Document</h2>
        <Link href={href} className="inline-flex min-h-11 items-center text-sm text-amber-700 hover:underline">
          Download PDF
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <iframe
          title="Document PDF"
          src={href}
          className="h-[min(80vh,56rem)] w-full"
        />
      </div>
    </div>
  );
}
