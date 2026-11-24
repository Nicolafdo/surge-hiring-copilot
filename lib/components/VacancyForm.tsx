"use client";
import { useState } from "react";
import { z } from "zod";
import SkillsInput from "@/lib/components/SkillInput";

export type VacancyValues = {
  title: string;
  job_description: string;
  skills: string[];
  location: string;
  closing_date: string;
  role_level: string;
  headcount: number;
  employment_type: string;
  work_arrangement: string;
  department: string;
  min_experience_years: number;
  contract_months: number | null;
};

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const schema = z.object({
  title: z.string().trim().min(2, "Job title is required").max(120),
  job_description: z
    .string()
    .trim()
    .min(20, "Job description must be at least 20 characters")
    .max(8000, "Job description is too long"),
  skills: z
    .array(z.string().trim().min(1).max(40))
    .min(1, "Add at least one required skill")
    .max(20),
  location: z.string().trim().min(2, "Location is required").max(120),
  closing_date: z
    .string()
    .min(1, "Choose a closing date")
    .refine((d) => d >= tomorrow, "Closing date must be in the future"),
  role_level: z.string().min(1, "Choose a level"),
  headcount: z
    .number()
    .int()
    .min(1, "Openings must be at least 1")
    .max(50, "Openings cannot exceed 50"),
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
});

export default function VacancyForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: VacancyValues;
  submitLabel: string;
  onSubmit: (v: VacancyValues) => Promise<string | null>; // error message or null
}) {
  const [v, setV] = useState({
    title: initial.title,
    job_description: initial.job_description,
    location: initial.location,
    closing_date: initial.closing_date,
    role_level: initial.role_level,
    employment_type: initial.employment_type,
    work_arrangement: initial.work_arrangement,
    department: initial.department,
    headcount: String(initial.headcount),
    min_experience_years: String(initial.min_experience_years),
    contract_months: initial.contract_months
      ? String(initial.contract_months)
      : "",
  });
  const [skills, setSkills] = useState<string[]>(initial.skills);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const set =
    (k: keyof typeof v) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setV({ ...v, [k]: e.target.value });

  const needsDuration =
    v.employment_type === "contract" || v.employment_type === "internship";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...v,
      skills,
      headcount: Number(v.headcount),
      min_experience_years: Number(v.min_experience_years),
      contract_months: needsDuration ? Number(v.contract_months) : null,
    });
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => i.message));
      return;
    }
    setErrors([]);
    setBusy(true);
    const msg = await onSubmit(parsed.data);
    setBusy(false);
    if (msg) setErrors([msg]);
  }

  return (
    <form onSubmit={submit} noValidate>
      <p>
        <label>
          Job title <input value={v.title} onChange={set("title")} />
        </label>
      </p>
      <p>
        <label>
          Job description
          <br />
          <textarea
            rows={8}
            value={v.job_description}
            onChange={set("job_description")}
          />
        </label>
      </p>
      <p>
        <label>
          Level{" "}
          <select value={v.role_level} onChange={set("role_level")}>
            <option value="">Select…</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid-level</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
        </label>
      </p>
      <p>
        <label>
          Employment type{" "}
          <select value={v.employment_type} onChange={set("employment_type")}>
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
              value={v.contract_months}
              onChange={set("contract_months")}
            />
          </label>
        </p>
      )}
      <p>
        <label>
          Work arrangement{" "}
          <select value={v.work_arrangement} onChange={set("work_arrangement")}>
            <option value="">Select…</option>
            <option value="on_site">On-site</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
        </label>
      </p>
      <p>
        <label>
          Department <input value={v.department} onChange={set("department")} />
        </label>
      </p>
      <p>
        <label>
          Openings{" "}
          <input
            type="number"
            min={1}
            max={50}
            value={v.headcount}
            onChange={set("headcount")}
          />
        </label>
      </p>
      <p>
        <label>
          Minimum experience (years){" "}
          <input
            type="number"
            min={0}
            max={40}
            value={v.min_experience_years}
            onChange={set("min_experience_years")}
          />
        </label>
      </p>
      <div>
        <p>Required skills</p>
        <SkillsInput value={skills} onChange={setSkills} />
      </div>
      <p>
        <label>
          Location (for remote roles, the country or region){" "}
          <input value={v.location} onChange={set("location")} />
        </label>
      </p>
      <p>
        <label>
          Closing date{" "}
          <input
            type="date"
            min={tomorrow}
            value={v.closing_date}
            onChange={set("closing_date")}
          />
        </label>
      </p>
      {errors.length > 0 && (
        <ul role="alert">
          {errors.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
      <button disabled={busy}>{busy ? "Saving…" : submitLabel}</button>
    </form>
  );
}
