import { EnquiryForm } from "@/components/record-forms";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listCustomers } from "@/db/queries";

export default async function NewEnquiryPage() {
  const customers = await listCustomers();
  return (
    <div>
      <PageHeader
        title="New enquiry"
        description="Record a WhatsApp, phone, or email request before you source prices."
      />
      <Card className="max-w-2xl border-slate-200/80 bg-white/90 shadow-none">
        <CardContent className="pt-6">
          <EnquiryForm customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))} />
        </CardContent>
      </Card>
    </div>
  );
}
