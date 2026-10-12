import { notFound } from "next/navigation";
import { SupplierForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getSupplier } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { canManageDirectory } from "@/lib/roles";

export default async function SupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();
  const user = await requireUser();
  const canEdit = user.role ? canManageDirectory(user.role) : false;

  return (
    <div>
      <PageHeader title={supplier.name} description={supplier.categories || "Supplier"} />
      <Card className="max-w-2xl border-slate-200/80 bg-white/90 shadow-none">
        <CardContent className="pt-6">
          {canEdit ? (
            <SupplierForm defaults={supplier} />
          ) : (
            <dl className="space-y-2 text-sm text-slate-700">
              <div>Contact: {supplier.contactPerson || "—"}</div>
              <div>Email: {supplier.email || "—"}</div>
              <div>Phone: {supplier.phone || "—"}</div>
              <div>Notes: {supplier.notes || "—"}</div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
