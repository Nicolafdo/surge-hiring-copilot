"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type AppRole } from "@/lib/auth/AuthProvider";

export default function RoleGuard({
  allow,
  children,
}: {
  allow?: AppRole[]; // leave out = any logged-in user
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login/");
  }, [loading, user, router]);

  if (loading || !user) return <p className="p-8">Loading...</p>;

  if (
    allow &&
    allow.length > 0 &&
    (!profile || !allow.includes(profile.role))
  ) {
    return (
      <div className="p-8">
        <p>You don&apos;t have access to this page.</p>
        <Link href="/dashboard/">Back to dashboard</Link>
      </div>
    );
  }

  return <>{children}</>;
}
