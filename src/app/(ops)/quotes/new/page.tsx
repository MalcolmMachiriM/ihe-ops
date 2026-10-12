import { QuoteForm } from "@/components/quote-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listCustomers, listEnquiries, listSuppliers } from "@/db/queries";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ enquiryId?: string }>;
}) {
  const { enquiryId } = await searchParams;
  const [customers, suppliers, enquiries] = await Promise.all([
    listCustomers(),
    listSuppliers(),
    listEnquiries(),
  ]);
  const enquiry = enquiries.find((item) => item.id === enquiryId);

  return (
    <div>
      <PageHeader
        title="New quote"
        description="Enter supplier cost, set markup, and check margin before the quote is sent."
      />
      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardContent className="pt-6">
          <QuoteForm
            customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))}
            suppliers={suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name }))}
            enquiries={enquiries.map((item) => ({
              id: item.id,
              reference: item.reference,
              title: item.title,
              customerId: item.customerId,
            }))}
            defaults={
              enquiry
                ? { enquiryId: enquiry.id, customerId: enquiry.customerId, currency: "USD" }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
