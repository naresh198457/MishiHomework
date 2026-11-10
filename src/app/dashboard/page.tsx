import Link from "next/link";
import Dashboard from "@/components/Dashboard";
import RequireLogin from "@/components/RequireLogin";

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/" className="btn-ghost !px-4 !py-1.5 text-sm">
        ← Back
      </Link>
      <h1 className="mb-6 mt-6 text-3xl font-bold">My progress</h1>
      <RequireLogin>
        <Dashboard />
      </RequireLogin>
    </main>
  );
}
