"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type AppRole } from "@/lib/auth/AuthProvider";

export default function RoleGuard({
  allow,
  children,
}: {
  allow?: AppRole[]; // leave empty = any logged-in user
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login/");
  }, [loading, user, router]);

  if (loading || !user) return <p className="p-8">Loading...</p>;
  if (allow && profile && !allow.includes(profile.role))
    return <p className="p-8">You don't have access to this page.</p>;

  return <>{children}</>;
}
