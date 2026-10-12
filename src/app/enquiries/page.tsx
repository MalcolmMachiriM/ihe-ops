import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { customerName, enquiries } from "@/lib/mock-data";

export default function EnquiriesPage() {
  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Capture client requests, assign sourcing, and chase supplier prices before you issue a quote."
        actionLabel="New enquiry"
      />

      <Card className="border-slate-200/80 bg-white/90 shadow-none">
        <CardHeader>
          <CardTitle>Request pipeline</CardTitle>
          <CardDescription>
            Status moves from new → sourcing → quoted → won/lost.
          </CardDescription>
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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.map((enquiry) => (
                <TableRow key={enquiry.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">
                      {enquiry.reference}
                    </div>
                    <div className="max-w-xs text-xs text-slate-500">
                      {enquiry.title}
                    </div>
                  </TableCell>
                  <TableCell>{customerName(enquiry.customerId)}</TableCell>
                  <TableCell>
                    <StatusBadge status={enquiry.urgency} />
                  </TableCell>
                  <TableCell>{enquiry.source}</TableCell>
                  <TableCell>{enquiry.assignedTo}</TableCell>
                  <TableCell>{formatDate(enquiry.createdAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={enquiry.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
