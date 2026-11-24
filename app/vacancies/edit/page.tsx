"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/lib/components/RoleGuard";
import VacancyForm, { type VacancyValues } from "@/lib/components/VacancyForm";

type Vac = {
  id: string;
  title: string;
  job_description: string;
  required_skills: string[];
  location: string;
  closing_date: string;
  status: string;
  role_level: string;
  headcount: number;
  employment_type: string;
  work_arrangement: string;
  department: string;
  min_experience_years: number;
  contract_months: number | null;
};

function EditVacancy() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const [vac, setVac] = useState<Vac | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) {
      setErr("No vacancy selected.");
      return;
    }
    supabase
      .from("vacancies")
      .select(
        "id, title, job_description, required_skills, location, closing_date, status, role_level, headcount, employment_type, work_arrangement, department, min_experience_years, contract_months",
      )
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setErr("Vacancy not found.");
          return;
        }
        if (data.status !== "draft") {
          setErr("Only draft vacancies can be edited.");
          return;
        }
        setVac(data as Vac);
      });
  }, [id]);

  if (err)
    return (
      <main className="p-8">
        <p role="alert">{err}</p>
        <Link href="/vacancies/">Back</Link>
      </main>
    );
  if (!vac) return <p className="p-8">Loading…</p>;

  async function save(v: VacancyValues) {
    const { error } = await supabase.rpc("update_vacancy", {
      p_id: vac!.id,
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
      return "Could not save the changes. Please try again.";
    }
    router.replace("/vacancies/");
    return null;
  }

  return (
    <main className="p-8">
      <h1>Edit vacancy</h1>
      <VacancyForm
        initial={{
          title: vac.title,
          job_description: vac.job_description,
          skills: vac.required_skills,
          location: vac.location,
          closing_date: vac.closing_date,
          role_level: vac.role_level,
          headcount: vac.headcount,
          employment_type: vac.employment_type,
          work_arrangement: vac.work_arrangement,
          department: vac.department,
          min_experience_years: vac.min_experience_years,
          contract_months: vac.contract_months,
        }}
        submitLabel="Save changes"
        onSubmit={save}
      />
    </main>
  );
}

export default function Page() {
  return (
    <RoleGuard allow={["hr"]}>
      <Suspense fallback={<p className="p-8">Loading…</p>}>
        <EditVacancy />
      </Suspense>
    </RoleGuard>
  );
}
