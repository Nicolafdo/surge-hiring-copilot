"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-3xl font-bold">Surge Hiring Copilot</h1>
      <p className="mt-2 text-gray-600">
        AI-assisted recruitment for Surge Global
      </p>

      <div className="mt-6 flex justify-center gap-3">
        {loading ? (
          <p>Loading...</p>
        ) : user ? (
          <Link href="/dashboard/" className="bg-black px-4 py-2 text-white">
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link href="/login/" className="bg-black px-4 py-2 text-white">
              Log in
            </Link>
            <Link href="/register/" className="border px-4 py-2">
              Register
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
