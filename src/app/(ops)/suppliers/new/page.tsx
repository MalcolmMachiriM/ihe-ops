import { SupplierForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function NewSupplierPage() {
  return (
    <div>
      <PageHeader title="Add supplier" description="Keep the people you ask for cost and lead time." />
      <Card className="max-w-2xl border-slate-200/80 bg-white/90 shadow-none">
        <CardContent className="pt-6">
          <SupplierForm />
        </CardContent>
      </Card>
    </div>
  );
}
