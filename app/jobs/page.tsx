"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/lib/components/RoleGuard";
import JobFacts, { type Facts } from "@/lib/components/JobFacts";

type Job = Facts & {
  id: string;
  title: string;
  location: string;
  closing_date: string;
};

function Jobs() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.rpc("list_open_vacancies").then(({ data, error }) => {
      if (error) {
        console.error(error);
        setErr("Could not load vacancies.");
        return;
      }
      setJobs(data as Job[]);
    });
  }, []);

  return (
    <main className="p-8">
      <h1>Open vacancies</h1>
      {err && <p role="alert">{err}</p>}
      {!jobs && !err && <p>Loading…</p>}
      {jobs && jobs.length === 0 && (
        <p>There are no open vacancies right now.</p>
      )}
      {jobs?.map((j) => (
        <section key={j.id} className="mt-6 border p-4">
          <h2>{j.title}</h2>
          <JobFacts v={j} />
          <p>
            {j.location} · Closes {j.closing_date}
          </p>
          <Link href={`/jobs/view/?id=${j.id}`}>View details</Link>
        </section>
      ))}
    </main>
  );
}

export default function Page() {
  return (
    <RoleGuard allow={["candidate", "hr"]}>
      <Jobs />
    </RoleGuard>
  );
}
