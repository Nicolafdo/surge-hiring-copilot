"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/lib/components/RoleGuard";
import { useAuth } from "@/lib/auth/AuthProvider";
import FinanceReview, { type ReqRow } from "@/lib/components/FinanceReview";

const STATUS: Record<string, string> = {
  pending_finance: "Waiting for Finance",
  approved: "Approved",
  rejected: "Rejected",
};

function List() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<ReqRow[] | null>(null);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState<ReqRow | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("requisitions")
      .select(
        "id, role_title, role_level, skills, headcount, needed_by, project_need, status, submitted_at, submitted_by_name, salary_min, salary_max, salary_currency, finance_comment",
      )
      .order("submitted_at", { ascending: false });
    if (error) {
      console.error(error);
      setErr("Could not load requisitions.");
      return;
    }
    setRows(data as ReqRow[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isFinance = profile?.role === "finance";

  return (
    <main className="p-8">
      <h1>{isFinance ? "Requisitions to review" : "My requisitions"}</h1>
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
              <th>Status</th>
              <th>Approved salary range</th>
              <th>Finance comment</th>
              {isFinance && <th></th>}
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
                <td>{STATUS[r.status] ?? r.status}</td>
                <td>
                  {r.salary_min != null && r.salary_max != null
                    ? `${r.salary_currency} ${Number(r.salary_min).toLocaleString()} – ${Number(r.salary_max).toLocaleString()} / month`
                    : "—"}
                </td>
                <td>{r.finance_comment ?? "—"}</td>
                {isFinance && (
                  <td>
                    {r.status === "pending_finance" && (
                      <button onClick={() => setSelected(r)}>Review</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {isFinance && selected && (
        <FinanceReview
          key={selected.id}
          row={selected}
          onCancel={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            load();
          }}
        />
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
