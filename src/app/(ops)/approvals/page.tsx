import Link from "next/link";
import { decideApproval } from "@/actions/approvals";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listPendingApprovals } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { canApproveQuotes } from "@/lib/roles";

export default async function ApprovalsPage() {
  const user = await requireUser();
  const canDecide = user.role ? canApproveQuotes(user.role) : false;
  const requests = await listPendingApprovals();

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Sales quotes under 15% margin, or with a line marked up under 10%, stay in draft until an admin approves that version."
      />
      <div className="space-y-3">
        {requests.length === 0 ? (
          <Card className="border-slate-200/80 bg-white/90 shadow-none">
            <CardContent className="pt-6 text-sm text-slate-600">No quotes are waiting.</CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="border-slate-200/80 bg-white/90 shadow-none">
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/quotes/${request.quoteId}`} className="font-medium text-amber-700 hover:underline">
                    {request.quoteNumber}
                  </Link>
                  <p className="text-sm text-slate-600">
                    {request.customerName} · version {request.version} · {formatDate(request.createdAt)}
                  </p>
                  <p className="text-sm text-slate-500">{request.reason}</p>
                </div>
                {canDecide ? (
                  <div className="flex gap-2">
                    <form action={decideApproval}>
                      <input type="hidden" name="id" value={request.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <Button type="submit" className="min-h-11">
                        Approve
                      </Button>
                    </form>
                    <form action={decideApproval}>
                      <input type="hidden" name="id" value={request.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <Button type="submit" variant="outline" className="min-h-11">
                        Reject
                      </Button>
                    </form>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
