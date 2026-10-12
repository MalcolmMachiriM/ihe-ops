import Link from "next/link";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getCustomer, getEnquiry, listCustomers } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { canEditQuotes, canManageEnquiries } from "@/lib/roles";
import { cn } from "@/lib/utils";

export default async function EnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const enquiry = await getEnquiry(id);
  if (!enquiry) notFound();

  const user = await requireUser();
  const canEdit = user.role ? canManageEnquiries(user.role) : false;
  const canQuote = user.role ? canEditQuotes(user.role) : false;
  const [customers, customer] = await Promise.all([
    canEdit ? listCustomers() : Promise.resolve([]),
    getCustomer(enquiry.customerId),
  ]);

  return (
    <div>
      <PageHeader
        title={enquiry.reference}
        description={enquiry.title}
        actionLabel={canQuote ? "New quote" : undefined}
        actionHref={`/quotes/new?enquiryId=${enquiry.id}`}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={enquiry.status} />
        <StatusBadge status={enquiry.urgency ?? "normal"} />
        <span className="text-sm capitalize text-slate-500">{enquiry.source}</span>
        {enquiry.neededBy ? (
          <span className="text-sm text-slate-500">Needed {formatDate(enquiry.neededBy)}</span>
        ) : null}
      </div>
      {canEdit ? (
        <Card className="max-w-2xl border-slate-200/80 bg-white/90 shadow-none">
          <CardContent className="pt-6">
            <EnquiryForm
              customers={customers.map((item) => ({ id: item.id, name: item.name }))}
              defaults={enquiry}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl border-slate-200/80 bg-white/90 shadow-none">
          <CardContent className="space-y-2 pt-6 text-sm text-slate-700">
            <p>Customer: {customer?.name ?? "Unknown"}</p>
            <p>{enquiry.description}</p>
            <Link href="/quotes" className={cn(buttonVariants({ variant: "outline" }))}>
              View quotes
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
