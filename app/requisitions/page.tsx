"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/lib/components/RoleGuard";
import { ARRANGEMENT, EMPLOYMENT, LEVEL } from "@/lib/labels";

type Row = {
  id: string;
  role_title: string;
  role_level: string;
  employment_type: string;
  work_arrangement: string;
  headcount: number;
  needed_by: string;
  status: string;
  submitted_at: string;
};

const STATUS: Record<string, string> = {
  submitted: "Submitted – waiting for HR",
  vacancy_created: "Vacancy created",
};

function List() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase
      .from("requisitions")
      .select(
        "id, role_title, role_level, employment_type, work_arrangement, headcount, needed_by, status, submitted_at",
      )
      .order("submitted_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          setErr("Could not load requisitions.");
          return;
        }
        setRows(data as Row[]);
      });
  }, []);

  return (
    <main className="p-8">
      <h1>My requisitions</h1>
      <p>
        <Link href="/requisitions/new/">New requisition</Link>
      </p>
      {err && <p role="alert">{err}</p>}
      {!rows && !err && <p>Loading…</p>}
      {rows && rows.length === 0 && <p>No requisitions yet.</p>}
      {rows && rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Level</th>
              <th>Type</th>
              <th>Arrangement</th>
              <th>Headcount</th>
              <th>Needed by</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.role_title}</td>
                <td>{LEVEL[r.role_level] ?? r.role_level}</td>
                <td>{EMPLOYMENT[r.employment_type] ?? r.employment_type}</td>
                <td>{ARRANGEMENT[r.work_arrangement] ?? r.work_arrangement}</td>
                <td>{r.headcount}</td>
                <td>{r.needed_by}</td>
                <td>{new Date(r.submitted_at).toLocaleDateString()}</td>
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
    <RoleGuard allow={["pm"]}>
      <List />
    </RoleGuard>
  );
}
