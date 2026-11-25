"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/lib/components/RoleGuard";
import JobFacts, { type Facts } from "@/lib/components/JobFacts";

type Job = Facts & {
  id: string;
  title: string;
  job_description: string;
  required_skills: string[];
  location: string;
  closing_date: string;
  nice_to_have_skills: string[];
};

function JobView() {
  const id = useSearchParams().get("id");
  const [job, setJob] = useState<Job | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    if (!id) {
      setState("missing");
      return;
    }
    supabase.rpc("get_open_vacancy", { p_id: id }).then(({ data, error }) => {
      const row = (data as Job[] | null)?.[0];
      if (error || !row) {
        setState("missing");
        return;
      }
      setJob(row);
      setState("ok");
    });
  }, [id]);

  if (state === "loading") return <p className="p-8">Loading…</p>;
  if (state === "missing" || !job)
    return (
      <main className="p-8">
        <p role="alert">This vacancy is not available.</p>
        <Link href="/jobs/">Back to vacancies</Link>
      </main>
    );

  return (
    <main className="p-8">
      <p>
        <Link href="/jobs/">← All vacancies</Link>
      </p>
      <h1>{job.title}</h1>
      <JobFacts v={job} />
      <p>
        {job.location} · Closes {job.closing_date}
      </p>
      <h2>About the role</h2>
      <p className="whitespace-pre-wrap">{job.job_description}</p>
      <h2>Must-Have skills</h2>
      <div className="flex flex-wrap gap-2">
        {job.required_skills.map((s) => (
          <span key={s} className="rounded-full border px-3 py-1 text-sm">
            {s}
          </span>
        ))}
      </div>
      {job.nice_to_have_skills.length > 0 && (
        <>
          <h2>Nice-to-have skills</h2>
          <div className="flex flex-wrap gap-2">
            {job.nice_to_have_skills.map((s) => (
              <span key={s} className="rounded-full border px-3 py-1 text-sm">
                {s}
              </span>
            ))}
          </div>
        </>
      )}
      <h2>Apply</h2>
      <p>
        Applications are open until {job.closing_date}. The application form is
        added in the next step (CP-01A).
      </p>
    </main>
  );
}

export default function Page() {
  return (
    <RoleGuard allow={["candidate", "hr"]}>
      <Suspense fallback={<p className="p-8">Loading…</p>}>
        <JobView />
      </Suspense>
    </RoleGuard>
  );
}
