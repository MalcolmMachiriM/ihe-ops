import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listEnquiries } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { SlaBadge } from "@/components/sla-badge";
import { formatDate } from "@/lib/format";
import { canManageEnquiries } from "@/lib/roles";

export default async function EnquiriesPage() {
  const user = await requireUser();
  const enquiries = await listEnquiries();

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Capture client requests, assign sourcing, and chase supplier prices before you issue a quote."
        actionLabel={user.role && canManageEnquiries(user.role) ? "New enquiry" : undefined}
        actionHref="/enquiries/new"
      />
      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardHeader>
          <CardTitle>Request pipeline</CardTitle>
          <CardDescription>Status moves from new → sourcing → quoted → won/lost.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>24h quote</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.map((enquiry) => (
                <TableRow key={enquiry.id}>
                  <TableCell>
                    <Link href={`/enquiries/${enquiry.id}`} className="font-medium text-slate-900 hover:underline">
                      {enquiry.reference}
                    </Link>
                    <div className="max-w-xs text-xs text-slate-500">{enquiry.title}</div>
                  </TableCell>
                  <TableCell>{enquiry.customerName}</TableCell>
                  <TableCell>
                    <StatusBadge status={enquiry.urgency ?? "normal"} />
                  </TableCell>
                  <TableCell className="capitalize">{enquiry.source}</TableCell>
                  <TableCell>{enquiry.assignedTo ?? "—"}</TableCell>
                  <TableCell>{formatDate(enquiry.createdAt)}</TableCell>
                  <TableCell>
                    <SlaBadge openedAt={enquiry.createdAt} quotedAt={enquiry.firstQuotedAt} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={enquiry.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {enquiries.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No enquiries yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
