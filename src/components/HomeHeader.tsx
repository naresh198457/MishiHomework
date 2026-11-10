"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

const pill = "rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-[#dfe7f7] transition hover:-translate-y-0.5";

export default function HomeHeader() {
  const { session, enabled, signOut, role } = useAuth();
  if (!enabled) return null;
  return (
    <nav className="mb-4 flex flex-wrap items-center justify-between gap-2">
      {session ? (
        <>
          <span className="flex flex-wrap gap-2">
            <Link href="/dashboard/" className={pill}>
              📈 My progress
            </Link>
            <Link href="/badges/" className={pill}>
              🏅 Badges
            </Link>
            <Link href="/history/" className={pill}>
              📒 My history
            </Link>
            <Link href="/report/" className={pill}>
              📄 Report
            </Link>
            {role === "parent" && (
              <Link href="/review/" className={pill}>
                🧑‍🏫 Review
              </Link>
            )}
          </span>
          <button onClick={signOut} className={pill}>
            Log out
          </button>
        </>
      ) : (
        <Link href="/login/" className={pill}>
          Log in
        </Link>
      )}
    </nav>
  );
}
