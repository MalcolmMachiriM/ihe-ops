import { setEnquiryStatus } from "@/actions/sourcing";
import { StatusBadge } from "@/components/status-badge";

const mainSteps = [
  ["new", "New"],
  ["sourcing", "Sourcing"],
  ["quoted", "Quoted"],
  ["won", "Won"],
] as const;

const sideSteps = [
  ["lost", "Lost"],
  ["expired", "Expired"],
] as const;

export function EnquiryStatusFlow({
  enquiryId,
  status,
  canEdit,
}: {
  enquiryId: string;
  status: string;
  canEdit: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {mainSteps.map(([value, label], index) => (
        <div key={value} className="flex items-center gap-2">
          {canEdit ? (
            <form action={setEnquiryStatus}>
              <input type="hidden" name="id" value={enquiryId} />
              <input type="hidden" name="status" value={value} />
              <button
                type="submit"
                className={
                  status === value
                    ? "rounded-lg bg-slate-950 px-3 py-1.5 text-sm text-white"
                    : "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                }
              >
                {label}
              </button>
            </form>
          ) : (
            <StatusBadge status={value === status ? status : value} />
          )}
          {index < mainSteps.length - 1 ? <span className="text-slate-300">→</span> : null}
        </div>
      ))}
      {sideSteps.map(([value, label]) =>
        canEdit ? (
          <form key={value} action={setEnquiryStatus}>
            <input type="hidden" name="id" value={enquiryId} />
            <input type="hidden" name="status" value={value} />
            <button
              type="submit"
              className={
                status === value
                  ? "rounded-lg bg-slate-950 px-3 py-1.5 text-sm text-white"
                  : "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500"
              }
            >
              {label}
            </button>
          </form>
        ) : null,
      )}
    </div>
  );
}
