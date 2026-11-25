import { ARRANGEMENT, EMPLOYMENT, LEVEL } from "@/lib/labels";

export type Facts = {
  role_level: string;
  headcount: number;
  employment_type: string;
  work_arrangement: string;
  department: string;
  min_experience_years: number;
  contract_months: number | null;
};

export default function JobFacts({ v }: { v: Facts }) {
  const items = [
    EMPLOYMENT[v.employment_type] ?? v.employment_type,
    ARRANGEMENT[v.work_arrangement] ?? v.work_arrangement,
    LEVEL[v.role_level] ?? v.role_level,
    v.department,
    v.min_experience_years > 0
      ? `${v.min_experience_years}+ years experience`
      : "No minimum experience",
    v.contract_months ? `${v.contract_months} months` : null,
    `${v.headcount} ${v.headcount === 1 ? "opening" : "openings"}`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <span key={t} className="rounded-full border px-3 py-1 text-sm">
          {t}
        </span>
      ))}
    </div>
  );
}
