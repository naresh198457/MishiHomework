"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function HomeHeader() {
  const { session, enabled, signOut } = useAuth();
  if (!enabled) return null;
  return (
    <div className="mb-6 flex items-center justify-between text-sm">
      {session ? (
        <>
          <span className="flex gap-4">
            <Link href="/dashboard/" className="font-medium underline">
              My progress
            </Link>
            <Link href="/history/" className="font-medium underline">
              My history
            </Link>
          </span>
          <button onClick={signOut} className="underline">
            Log out
          </button>
        </>
      ) : (
        <Link href="/login/" className="font-medium underline">
          Log in
        </Link>
      )}
    </div>
  );
}
