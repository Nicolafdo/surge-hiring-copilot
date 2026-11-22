"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export type ReqRow = {
  id: string;
  role_title: string;
  role_level: string;
  skills: string[];
  headcount: number;
  needed_by: string;
  project_need: string | null;
  status: string;
  submitted_at: string;
  submitted_by_name: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  finance_comment: string | null;
};

export default function FinanceReview({
  row,
  onDone,
  onCancel,
}: {
  row: ReqRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [decision, setDecision] = useState<"" | "approved" | "rejected">("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    const nMin = Number(min),
      nMax = Number(max);
    if (!decision) errs.push("Choose approve or reject");
    if (decision === "approved") {
      if (!(nMin > 0)) errs.push("Enter the minimum salary");
      if (!(nMax > 0)) errs.push("Enter the maximum salary");
      if (nMin > 0 && nMax > 0 && nMax < nMin)
        errs.push("Maximum salary must be at least the minimum");
    }
    if (decision === "rejected" && !comment.trim())
      errs.push("A comment is required when rejecting");
    if (comment.length > 1000)
      errs.push("Comment is too long (maximum 1000 characters)");
    if (errs.length) {
      setErrors(errs);
      return;
    }

    setErrors([]);
    setBusy(true);
    const { error } = await supabase.rpc("finance_decide_requisition", {
      p_id: row.id,
      p_decision: decision,
      p_salary_min: decision === "approved" ? nMin : null,
      p_salary_max: decision === "approved" ? nMax : null,
      p_comment: comment.trim() || null,
    });
    setBusy(false);
    if (error) {
      console.error(error);
      setErrors([
        error.message.includes("already been decided")
          ? "This requisition has already been decided."
          : "Could not save the decision. Please try again.",
      ]);
      return;
    }
    onDone();
  }

  return (
    <section className="mt-6 border p-4">
      <h2>Review: {row.role_title}</h2>
      <ul>
        <li>Level: {row.role_level}</li>
        <li>Skills: {row.skills.join(", ")}</li>
        <li>Headcount: {row.headcount}</li>
        <li>Needed by: {row.needed_by}</li>
        <li>
          Submitted by: {row.submitted_by_name} on{" "}
          {new Date(row.submitted_at).toLocaleDateString()}
        </li>
        {row.project_need && <li>Project need: {row.project_need}</li>}
      </ul>
      <form onSubmit={submit} noValidate>
        <p>
          <label>
            <input
              type="radio"
              name="d"
              checked={decision === "approved"}
              onChange={() => setDecision("approved")}
            />{" "}
            Approve budget
          </label>{" "}
          <label>
            <input
              type="radio"
              name="d"
              checked={decision === "rejected"}
              onChange={() => setDecision("rejected")}
            />{" "}
            Reject
          </label>
        </p>
        {decision === "approved" && (
          <p>
            Approved salary range ({row.salary_currency} per month){" "}
            <input
              type="number"
              min={1}
              placeholder="Minimum"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />{" "}
            to{" "}
            <input
              type="number"
              min={1}
              placeholder="Maximum"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </p>
        )}
        <p>
          <label>
            Comment{decision === "rejected" ? " (required)" : " (optional)"}
            <br />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
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
        <button disabled={busy}>{busy ? "Saving…" : "Record decision"}</button>{" "}
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </section>
  );
}
