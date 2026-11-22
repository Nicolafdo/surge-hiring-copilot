"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/lib/components/RoleGuard";
import { useAuth } from "@/lib/auth/AuthProvider";

type Row = {
  id: string;
  role_title: string;
  role_level: string;
  headcount: number;
  needed_by: string;
  status: string;
  submitted_at: string;
  submitted_by_name: string | null;
};

const STATUS: Record<string, string> = {
  pending_finance: "Waiting for Finance",
  approved: "Approved",
  rejected: "Rejected",
};

function List() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("requisitions")
        .select(
          "id, role_title, role_level, headcount, needed_by, status, submitted_at, submitted_by_name",
        )
        .order("submitted_at", { ascending: false });
      if (error) {
        console.error(error);
        setErr("Could not load requisitions.");
        return;
      }
      setRows(data as Row[]);
    })();
  }, []);

  return (
    <main className="p-8">
      <h1>
        {profile?.role === "finance"
          ? "Requisitions to review"
          : "My requisitions"}
      </h1>
      {profile?.role === "pm" && (
        <p>
          <Link href="/requisitions/new/">New requisition</Link>
        </p>
      )}
      {err && <p role="alert">{err}</p>}
      {!rows && !err && <p>Loading…</p>}
      {rows && rows.length === 0 && <p>No requisitions yet.</p>}
      {rows && rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Level</th>
              <th>Headcount</th>
              <th>Needed by</th>
              <th>Submitted by</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.role_title}</td>
                <td>{r.role_level}</td>
                <td>{r.headcount}</td>
                <td>{r.needed_by}</td>
                <td>{r.submitted_by_name}</td>
                <td>{new Date(r.submitted_at).toLocaleString()}</td>
                <td>{STATUS[r.status] ?? r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <RoleGuard allow={["pm", "finance"]}>
      <List />
    </RoleGuard>
  );
}
