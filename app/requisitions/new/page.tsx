"use client";
import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/lib/components/RoleGuard";
import SkillsInput from "@/lib/components/SkillInput";

const today = new Date().toISOString().slice(0, 10);

const schema = z.object({
  role_title: z.string().trim().min(2, "Role title is required").max(120),
  role_level: z.string().min(1, "Choose a role level"),
  employment_type: z.string().min(1, "Choose an employment type"),
  work_arrangement: z.string().min(1, "Choose a work arrangement"),
  department: z.string().trim().min(2, "Department is required").max(80),
  min_experience_years: z
    .number()
    .int()
    .min(0, "Experience cannot be negative")
    .max(40, "Experience cannot exceed 40 years"),
  contract_months: z
    .number()
    .int()
    .min(1, "Duration must be between 1 and 60 months")
    .max(60, "Duration must be between 1 and 60 months")
    .nullable(),
  skills: z
    .array(z.string().trim().min(1).max(40))
    .min(1, "Add at least one skill")
    .max(20),
  headcount: z
    .number()
    .int()
    .min(1, "Headcount must be at least 1")
    .max(50, "Headcount cannot exceed 50"),
  needed_by: z
    .string()
    .min(1, "Choose a start date")
    .refine((d) => d >= today, "Start date cannot be in the past"),
  project_need: z.string().trim().max(1000),
});

function RequisitionForm() {
  const [f, setF] = useState({
    role_title: "",
    role_level: "",
    employment_type: "",
    work_arrangement: "",
    department: "",
    min_experience_years: "0",
    contract_months: "",
    headcount: "1",
    needed_by: "",
    project_need: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  const set =
    (k: keyof typeof f) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setF({ ...f, [k]: e.target.value });

  const needsDuration =
    f.employment_type === "contract" || f.employment_type === "internship";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...f,
      skills,
      headcount: Number(f.headcount),
      min_experience_years: Number(f.min_experience_years),
      contract_months: needsDuration ? Number(f.contract_months) : null,
    });
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => i.message));
      return;
    }
    setErrors([]);
    setBusy(true);
    const { data, error } = await supabase
      .from("requisitions")
      .insert({
        ...parsed.data,
        project_need: parsed.data.project_need || null,
      })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      console.error(error);
      setErrors(["Could not submit the requisition. Please try again."]);
      return;
    }
    setDoneId(data.id);
  }

  if (doneId)
    return (
      <main className="p-8">
        <h1>Requisition submitted</h1>
        <p>
          Sent to Finance for the budget and salary check. Reference:{" "}
          {doneId.slice(0, 8)}
        </p>
        <Link href="/requisitions/">View my requisitions</Link>
      </main>
    );

  return (
    <main className="p-8">
      <h1>New staffing requisition</h1>
      <form onSubmit={onSubmit} noValidate>
        <p>
          <label>
            Role title{" "}
            <input value={f.role_title} onChange={set("role_title")} />
          </label>
        </p>
        <p>
          <label>
            Level{" "}
            <select value={f.role_level} onChange={set("role_level")}>
              <option value="">Select…</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
          </label>
        </p>
        <p>
          <label>
            Employment type{" "}
            <select value={f.employment_type} onChange={set("employment_type")}>
              <option value="">Select…</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </label>
        </p>
        {needsDuration && (
          <p>
            <label>
              Duration (months){" "}
              <input
                type="number"
                min={1}
                max={60}
                value={f.contract_months}
                onChange={set("contract_months")}
              />
            </label>
          </p>
        )}
        <p>
          <label>
            Work arrangement{" "}
            <select
              value={f.work_arrangement}
              onChange={set("work_arrangement")}
            >
              <option value="">Select…</option>
              <option value="on_site">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </label>
        </p>
        <p>
          <label>
            Department{" "}
            <input value={f.department} onChange={set("department")} />
          </label>
        </p>
        <p>
          <label>
            Minimum experience (years){" "}
            <input
              type="number"
              min={0}
              max={40}
              value={f.min_experience_years}
              onChange={set("min_experience_years")}
            />
          </label>
        </p>
        <div>
          <p>Skills</p>
          <SkillsInput value={skills} onChange={setSkills} />
        </div>
        <p>
          <label>
            Headcount{" "}
            <input
              type="number"
              min={1}
              value={f.headcount}
              onChange={set("headcount")}
            />
          </label>
        </p>
        <p>
          <label>
            Needed by{" "}
            <input
              type="date"
              min={today}
              value={f.needed_by}
              onChange={set("needed_by")}
            />
          </label>
        </p>
        <p>
          <label>
            Project need (optional)
            <br />
            <textarea value={f.project_need} onChange={set("project_need")} />
          </label>
        </p>
        {errors.length > 0 && (
          <ul role="alert">
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
        <button disabled={busy}>
          {busy ? "Submitting…" : "Submit to Finance"}
        </button>
      </form>
    </main>
  );
}

export default function Page() {
  return (
    <RoleGuard allow={["pm"]}>
      <RequisitionForm />
    </RoleGuard>
  );
}
