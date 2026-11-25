"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/lib/components/RoleGuard";

type Vac = {
  id: string;
  requisition_id: string;
  title: string;
  status: string;
  location: string;
  closing_date: string;
};
type Req = {
  id: string;
  role_title: string;
  role_level: string;
  headcount: number;
  needed_by: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
};
type Action = "publish" | "unpublish" | "close";

const todayLK = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });

function statusLabel(v: Vac) {
  if (v.status === "draft") return "Draft";
  if (v.status === "closed") return "Closed";
  return v.closing_date >= todayLK()
    ? "Published – accepting applications"
    : "Published – past closing date";
}

function friendly(msg: string) {
  if (msg.includes("Closing date has passed"))
    return "The closing date has passed. Edit the vacancy and choose a new closing date before publishing.";
  if (msg.includes("already closed")) return "This vacancy is already closed.";
  return "Could not update the vacancy. Please try again.";
}

function List() {
  const [vacs, setVacs] = useState<Vac[] | null>(null);
  const [reqs, setReqs] = useState<Req[] | null>(null);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [v, r] = await Promise.all([
      supabase
        .from("vacancies")
        .select("id, requisition_id, title, status, location, closing_date")
        .order("created_at", { ascending: false }),
      supabase
        .from("requisitions")
        .select(
          "id, role_title, role_level, headcount, needed_by, salary_min, salary_max, salary_currency",
        )
        .eq("status", "approved")
        .order("reviewed_at", { ascending: false }),
    ]);
    if (v.error || r.error) {
      console.error(v.error ?? r.error);
      setErr("Could not load data.");
      return;
    }
    setVacs(v.data as Vac[]);
    setReqs(r.data as Req[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(v: Vac, action: Action) {
    if (
      action === "close" &&
      !window.confirm(
        `Close "${v.title}"? A closed vacancy cannot be reopened.`,
      )
    )
      return;
    setErr("");
    setBusyId(v.id);
    const { error } = await supabase.rpc("change_vacancy_status", {
      p_id: v.id,
      p_action: action,
      p_reason: null,
    });
    setBusyId(null);
    if (error) {
      console.error(error);
      setErr(friendly(error.message));
      return;
    }
    await load();
  }

  const waiting =
    reqs && vacs
      ? reqs.filter((r) => !vacs.some((v) => v.requisition_id === r.id))
      : [];

  return (
    <main className="p-8">
      <h1>Vacancies</h1>
      {err && <p role="alert">{err}</p>}
      {!err && (!vacs || !reqs) && <p>Loading…</p>}

      {vacs && reqs && (
        <>
          <h2>Approved requisitions waiting for a vacancy</h2>
          {waiting.length === 0 ? (
            <p>None.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Level</th>
                  <th>Headcount</th>
                  <th>Needed by</th>
                  <th>Approved range</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {waiting.map((r) => (
                  <tr key={r.id}>
                    <td>{r.role_title}</td>
                    <td>{r.role_level}</td>
                    <td>{r.headcount}</td>
                    <td>{r.needed_by}</td>
                    <td>
                      {r.salary_currency}{" "}
                      {Number(r.salary_min).toLocaleString()} –{" "}
                      {Number(r.salary_max).toLocaleString()}
                    </td>
                    <td>
                      <Link href={`/vacancies/new/?requisition=${r.id}`}>
                        Create vacancy
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2>My vacancies</h2>
          {vacs.length === 0 ? (
            <p>No vacancies yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Closing date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vacs.map((v) => (
                  <tr key={v.id}>
                    <td>{v.title}</td>
                    <td>{v.location}</td>
                    <td>{v.closing_date}</td>
                    <td>{statusLabel(v)}</td>
                    <td>
                      {v.status === "draft" && (
                        <>
                          <Link href={`/vacancies/edit/?id=${v.id}`}>Edit</Link>{" "}
                          <button
                            disabled={busyId === v.id}
                            onClick={() => act(v, "publish")}
                          >
                            Publish
                          </button>{" "}
                          <button
                            disabled={busyId === v.id}
                            onClick={() => act(v, "close")}
                          >
                            Close
                          </button>
                        </>
                      )}
                      {v.status === "published" && (
                        <>
                          <button
                            disabled={busyId === v.id}
                            onClick={() => act(v, "unpublish")}
                          >
                            Unpublish to edit
                          </button>{" "}
                          <button
                            disabled={busyId === v.id}
                            onClick={() => act(v, "close")}
                          >
                            Close
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <RoleGuard allow={["hr"]}>
      <List />
    </RoleGuard>
  );
}
