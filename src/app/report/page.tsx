import Link from "next/link";
import ReportView from "@/components/ReportView";
import RequireLogin from "@/components/RequireLogin";

export default function ReportPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 print:max-w-none print:p-0">
      <Link href="/" className="btn-ghost no-print !px-4 !py-1.5 text-sm">
        ← Back
      </Link>
      <h1 className="no-print mb-6 mt-6 text-3xl font-extrabold">📄 Progress report</h1>
      <RequireLogin>
        <ReportView />
      </RequireLogin>
    </main>
  );
}
