import { CustomerForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function NewCustomerPage() {
  return (
    <div>
      <PageHeader title="Add customer" description="Save the company and the person who asks for prices." />
      <Card className="max-w-2xl border-slate-200/80 bg-white/90 shadow-none">
        <CardContent className="pt-6">
          <CustomerForm />
        </CardContent>
      </Card>
    </div>
  );
}
