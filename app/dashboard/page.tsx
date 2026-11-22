"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth/AuthProvider";
import RoleGuard from "@/lib/components/RoleGuard";
import { NAV, ROLE_LABEL, HREF } from "@/lib/roles";

function DashboardContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  if (!profile) return <p className="p-8">Loading...</p>;

  return (
    <main className="p-8">
      <h1>{ROLE_LABEL[profile.role]} dashboard</h1>
      <p>Signed in as {user?.email}</p>
      <ul>
        {NAV[profile.role].map((item) => (
          <li key={item}>
            {HREF[item] ? <Link href={HREF[item]}>{item}</Link> : item}
          </li>
        ))}
      </ul>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.replace("/login/");
        }}
      >
        Sign out
      </button>
    </main>
  );
}

export default function Dashboard() {
  return (
    <RoleGuard>
      <DashboardContent />
    </RoleGuard>
  );
}
