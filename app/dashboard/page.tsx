"use client";
import RoleGuard from "@/lib/components/RoleGuard";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  return (
    <RoleGuard>
      <main className="p-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2">
          Signed in as {profile?.email} · role: <b>{profile?.role}</b>
        </p>
        <button className="mt-4 border px-3 py-1" onClick={signOut}>
          Log out
        </button>
      </main>
    </RoleGuard>
  );
}
