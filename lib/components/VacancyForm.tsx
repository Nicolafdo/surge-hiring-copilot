"use client";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import SkillsInput from "@/lib/components/SkillInput";

export type VacancyValues = {
  title: string;
  job_description: string;
  skills: string[];
  nice_to_have: string[];
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
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

const schema = z
  .object({
    title: z.string().trim().min(2, "Job title is required").max(120),
    job_description: z
      .string()
      .trim()
      .min(20, "Job description must be at least 20 characters")
      .max(8000, "Job description is too long"),
    skills: z
      .array(z.string().trim().min(1).max(40))
      .min(1, "Add at least one must-have skill")
      .max(20),
    nice_to_have: z.array(z.string().trim().min(1).max(40)).max(20),
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
  })
  .refine(
    (d) => !d.nice_to_have.some((n) => d.skills.some((s) => same(s, n))),
    {
      message: "A skill cannot be both must-have and nice-to-have",
      path: ["nice_to_have"],
    },
  );

type Suggestion = { must_have: string[]; nice_to_have: string[]; mode: string };

function mergeInto(base: string[], add: string[], max = 20) {
  const out = [...base];
  for (const s of add)
    if (out.length < max && !out.some((x) => same(x, s))) out.push(s);
  return out;
}

async function errorText(error: unknown): Promise<string> {
  try {
    const res = (error as { context?: Response }).context;
    if (res && typeof res.json === "function") {
      const body = await res.json();
      if (body?.error) return String(body.error);
    }
  } catch {
    /* fall through */
  }
  return "The AI service is unavailable. You can type the requirements manually.";
}

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
  const [nice, setNice] = useState<string[]>(initial.nice_to_have);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [cool, setCool] = useState(false);

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
  const canSuggest = v.job_description.trim().length >= 20 && !aiBusy && !cool;

  async function suggest() {
    setAiMsg("");
    setSuggestion(null);
    setAiBusy(true);
    const { data, error } = await supabase.functions.invoke(
      "suggest-requirements",
      {
        body: { title: v.title, job_description: v.job_description },
      },
    );
    setAiBusy(false);
    setCool(true);
    setTimeout(() => setCool(false), 8000); // small pause so the free AI quota isn't wasted
    if (error) {
      setAiMsg(await errorText(error));
      return;
    }
    setSuggestion(data as Suggestion);
  }

  function useReplace() {
    if (!suggestion) return;
    if (
      (skills.length || nice.length) &&
      !window.confirm(
        "Replace your current must-have and nice-to-have lists with the suggestion?",
      )
    )
      return;
    setSkills(suggestion.must_have);
    setNice(
      suggestion.nice_to_have.filter(
        (n) => !suggestion.must_have.some((m) => same(m, n)),
      ),
    );
    setSuggestion(null);
  }

  function useMerge() {
    if (!suggestion) return;
    const must = mergeInto(skills, suggestion.must_have);
    setSkills(must);
    setNice(
      mergeInto(nice, suggestion.nice_to_have).filter(
        (n) => !must.some((m) => same(m, n)),
      ),
    );
    setSuggestion(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...v,
      skills,
      nice_to_have: nice,
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

      <section className="my-4 border p-4">
        <button type="button" onClick={suggest} disabled={!canSuggest}>
          {aiBusy ? "Analysing…" : "Suggest requirements with AI"}
        </button>
        <p>
          <small>
            The job description text is sent to an AI service, so don&apos;t
            include personal data. The AI only suggests. You review and edit
            everything below before saving.
            {v.job_description.trim().length < 20 &&
              " Write at least 20 characters of the description first."}
          </small>
        </p>
        {aiMsg && <p role="alert">{aiMsg}</p>}
        {suggestion && (
          <div>
            <p>
              <strong>AI suggestion – review before using</strong>
              {suggestion.mode === "mock" &&
                " (test mode: keyword matching, not the real AI)"}
            </p>
            <p>Must-have:</p>
            <div className="flex flex-wrap gap-2">
              {suggestion.must_have.map((s) => (
                <span key={s} className="rounded-full border px-3 py-1 text-sm">
                  {s}
                </span>
              ))}
            </div>
            <p>Nice-to-have:</p>
            <div className="flex flex-wrap gap-2">
              {suggestion.nice_to_have.length === 0 && (
                <span>None suggested</span>
              )}
              {suggestion.nice_to_have.map((s) => (
                <span key={s} className="rounded-full border px-3 py-1 text-sm">
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-2">
              <button type="button" onClick={useReplace}>
                Replace my lists
              </button>{" "}
              <button type="button" onClick={useMerge}>
                Add to my lists
              </button>{" "}
              <button type="button" onClick={() => setSuggestion(null)}>
                Dismiss
              </button>
            </p>
          </div>
        )}
      </section>

      <div>
        <p>Must-have skills</p>
        <SkillsInput value={skills} onChange={setSkills} />
      </div>
      <div>
        <p>Nice-to-have skills (optional)</p>
        <SkillsInput value={nice} onChange={setNice} />
      </div>

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
