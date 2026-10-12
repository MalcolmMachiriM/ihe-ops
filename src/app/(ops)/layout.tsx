import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <AppShell role={user.role}>
      {user.role ? (
        children
      ) : (
        <div className="max-w-xl rounded-xl border border-amber-200 bg-white p-6">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-slate-950">
            Staff role required
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            This account can sign in, but it has no IHE role yet. In the Clerk
            dashboard, set the user&apos;s public metadata to{" "}
            <code>{`{ "role": "admin" }`}</code>, <code>&quot;sales&quot;</code>, or{" "}
            <code>&quot;accounts&quot;</code>. Add{" "}
            <code>{`{ "metadata": "{{user.public_metadata}}" }`}</code> to the
            session token, then sign in again.
          </p>
        </div>
      )}
    </AppShell>
  );
}
