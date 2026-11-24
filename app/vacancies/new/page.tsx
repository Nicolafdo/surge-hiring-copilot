"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/lib/components/RoleGuard";
import VacancyForm, { type VacancyValues } from "@/lib/components/VacancyForm";

type Req = {
  id: string;
  role_title: string;
  skills: string[];
  status: string;
  role_level: string;
  headcount: number;
  employment_type: string;
  work_arrangement: string;
  department: string;
  needed_by: string | null;
  min_experience_years: number;
  contract_months: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
};

function NewVacancy() {
  const router = useRouter();
  const reqId = useSearchParams().get("requisition");
  const [req, setReq] = useState<Req | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!reqId) {
      setErr("No requisition selected.");
      return;
    }
    supabase
      .from("requisitions")
      .select(
        "id, role_title, skills, status, role_level, needed_by, headcount, employment_type, work_arrangement, department, min_experience_years, contract_months, salary_min, salary_max, salary_currency",
      )
      .eq("id", reqId)
      .single()
      .then(({ data, error }) => {
        if (error || !data || data.status !== "approved") {
          setErr("This requisition is not available for a vacancy.");
          return;
        }
        setReq(data as Req);
      });
  }, [reqId]);

  if (err)
    return (
      <main className="p-8">
        <p role="alert">{err}</p>
        <Link href="/vacancies/">Back</Link>
      </main>
    );
  if (!req) return <p className="p-8">Loading…</p>;

  async function create(v: VacancyValues) {
    const { error } = await supabase.rpc("create_vacancy", {
      p_requisition_id: req!.id,
      p_title: v.title,
      p_job_description: v.job_description,
      p_skills: v.skills,
      p_location: v.location,
      p_closing_date: v.closing_date,
      p_role_level: v.role_level,
      p_headcount: v.headcount,
      p_employment_type: v.employment_type,
      p_work_arrangement: v.work_arrangement,
      p_department: v.department,
      p_min_experience_years: v.min_experience_years,
      p_contract_months: v.contract_months,
    });
    if (error) {
      console.error(error);
      return error.message.includes("already exists")
        ? "A vacancy already exists for this requisition."
        : "Could not create the vacancy. Please try again.";
    }
    router.replace("/vacancies/");
    return null;
  }

  return (
    <main className="p-8">
      <h1>Create vacancy</h1>
      <p>
        <small>
          Details are prefilled from the approved requisition and you can change
          any of them. Finance approved {req.salary_currency}{" "}
          {Number(req.salary_min).toLocaleString()} –{" "}
          {Number(req.salary_max).toLocaleString()} per month for the
          requisition as submitted.
        </small>
      </p>
      <VacancyForm
        initial={{
          title: req.role_title,
          job_description: "",
          skills: req.skills,
          location: "",
          closing_date: req.needed_by ? req.needed_by.slice(0, 10) : "",
          role_level: req.role_level,
          headcount: req.headcount,
          employment_type: req.employment_type,
          work_arrangement: req.work_arrangement,
          department: req.department,
          min_experience_years: req.min_experience_years,
          contract_months: req.contract_months,
        }}
        submitLabel="Save draft vacancy"
        onSubmit={create}
      />
    </main>
  );
}

export default function Page() {
  return (
    <RoleGuard allow={["hr"]}>
      <Suspense fallback={<p className="p-8">Loading…</p>}>
        <NewVacancy />
      </Suspense>
    </RoleGuard>
  );
}
