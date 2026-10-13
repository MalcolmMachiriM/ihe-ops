import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getCustomer } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { canManageDirectory } from "@/lib/roles";

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const user = await requireUser();
  const canEdit = user.role ? canManageDirectory(user.role) : false;

  return (
    <div>
      <PageHeader title={customer.name} description={customer.company || "Customer"} />
      <p className="mb-4 text-sm">
        <Link href={`/customers/${customer.id}/statement`} className="text-amber-700 hover:underline">
          View statement
        </Link>
      </p>
      <Card className="max-w-2xl border-slate-200/80 bg-white/90 shadow-none">
        <CardContent className="pt-6">
          {canEdit ? (
            <CustomerForm defaults={customer} />
          ) : (
            <dl className="space-y-2 text-sm text-slate-700">
              <div>Contact: {customer.contactPerson || "—"}</div>
              <div>Email: {customer.email || "—"}</div>
              <div>Phone: {customer.phone || "—"}</div>
              <div>Address: {customer.address || "—"}</div>
              <div>Notes: {customer.notes || "—"}</div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
