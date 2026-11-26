"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth/AuthProvider";
import RoleGuard from "@/lib/components/RoleGuard";

type Notice = { version: string; body: string };
type Job = { id: string; title: string; closing_date: string };

const MAX_BYTES = 5 * 1024 * 1024;
const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z
    .string()
    .trim()
    .max(254)
    .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9 ()-]{5,19}$/, "Enter a valid phone number"),
});

function friendly(m: string) {
  if (m.includes("closed or not available"))
    return "This vacancy has closed or is no longer available.";
  if (m.includes("already applied"))
    return "You have already applied for this vacancy.";
  if (m.includes("notice has changed"))
    return "The consent notice was updated. Please reload the page and try again.";
  if (
    m.includes("Invalid CV file") ||
    m.includes("not uploaded") ||
    m.includes("Unsupported file")
  )
    return "There was a problem with your CV file. Please choose it again.";
  return "Could not submit your application. Please try again.";
}

function ApplyForm() {
  const id = useSearchParams().get("id");
  const { user, profile } = useAuth();
  const [state, setState] = useState<
    "loading" | "ready" | "unavailable" | "done"
  >("loading");
  const [job, setJob] = useState<Job | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [f, setF] = useState({ full_name: "", email: "", phone: "" });
  const [consent, setConsent] = useState<"" | "yes" | "no">("");
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState("");

  useEffect(() => {
    if (!id) {
      setState("unavailable");
      return;
    }
    (async () => {
      const [j, n, a] = await Promise.all([
        supabase.rpc("get_open_vacancy", { p_id: id }),
        supabase.rpc("get_consent_notice"),
        supabase.rpc("has_applied", { p_vacancy_id: id }),
      ]);
      const row = (j.data as Job[] | null)?.[0];
      const nt = (n.data as Notice[] | null)?.[0];
      if (j.error || n.error || !row || !nt) {
        setState("unavailable");
        return;
      }
      setJob(row);
      setNotice(nt);
      setAlreadyApplied(Boolean(a.data));
      setState("ready");
    })();
  }, [id]);

  useEffect(() => {
    const name =
      (profile as { full_name?: string | null } | null)?.full_name ?? "";
    setF((p) => ({
      ...p,
      full_name: p.full_name || name,
      email: p.email || user?.email || "",
    }));
  }, [profile, user]);

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFile(null);
    setFileErr("");
    if (!picked) return;
    const lower = picked.name.toLowerCase();
    const ext = lower.endsWith(".pdf")
      ? "pdf"
      : lower.endsWith(".docx")
        ? "docx"
        : "";
    if (!ext) {
      setFileErr("Upload a PDF or DOCX file.");
      return;
    }
    if (picked.size === 0) {
      setFileErr("This file is empty.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      setFileErr("The file is larger than 5 MB.");
      return;
    }
    const head = String.fromCharCode(
      ...new Uint8Array(await picked.slice(0, 5).arrayBuffer()),
    );
    const looksRight =
      ext === "pdf" ? head.startsWith("%PDF-") : head.startsWith("PK");
    if (!looksRight) {
      setFileErr("This file does not look like a real PDF or DOCX.");
      return;
    }
    setFile(picked);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    const parsed = schema.safeParse(f);
    if (!parsed.success)
      errs.push(...parsed.error.issues.map((i) => i.message));
    if (!file) errs.push(fileErr || "Attach your CV (PDF or DOCX, up to 5 MB)");
    if (!consent)
      errs.push("Choose whether you consent to AI-assisted screening");
    if (errs.length || !parsed.success || !file || !job || !notice || !user) {
      setErrors(errs);
      return;
    }

    setErrors([]);
    setBusy(true);
    const appId = crypto.randomUUID();
    const ext = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx";
    const path = `${user.id}/${appId}.${ext}`;

    const up = await supabase.storage.from("cvs").upload(path, file, {
      contentType: ext === "pdf" ? "application/pdf" : DOCX,
      upsert: false,
    });
    if (up.error) {
      console.error(up.error);
      setBusy(false);
      setErrors(["Could not upload your CV. Please try again."]);
      return;
    }

    const { error } = await supabase.rpc("apply_to_vacancy", {
      p_application_id: appId,
      p_vacancy_id: job.id,
      p_full_name: parsed.data.full_name,
      p_email: parsed.data.email,
      p_phone: parsed.data.phone,
      p_ai_consent: consent === "yes",
      p_notice_version: notice.version,
      p_cv_path: path,
      p_cv_filename: file.name,
    });
    setBusy(false);
    if (error) {
      console.error(error);
      setErrors([friendly(error.message)]);
      return;
    }
    setRef(appId.slice(0, 8));
    setState("done");
  }

  if (state === "loading") return <p className="p-8">Loading…</p>;
  if (state === "unavailable" || !job || !notice)
    return (
      <main className="p-8">
        <p role="alert">This vacancy is not available.</p>
        <Link href="/jobs/">Back to vacancies</Link>
      </main>
    );
  if (state === "done")
    return (
      <main className="p-8">
        <h1>Application submitted</h1>
        <p>
          Thank you. Your application for {job.title} was received. Reference:{" "}
          {ref}
        </p>
        <p>
          {consent === "yes"
            ? "You agreed to AI-assisted screening. Your CV will be anonymised before the AI sees it."
            : "You chose manual review. An HR team member will read your CV."}
        </p>
        <Link href="/jobs/">Back to vacancies</Link>
      </main>
    );
  if (alreadyApplied)
    return (
      <main className="p-8">
        <h1>{job.title}</h1>
        <p>You have already applied for this vacancy.</p>
        <Link href="/jobs/">Back to vacancies</Link>
      </main>
    );

  return (
    <main className="p-8">
      <p>
        <Link href={`/jobs/view/?id=${job.id}`}>← Back to the vacancy</Link>
      </p>
      <h1>Apply: {job.title}</h1>
      <p>Applications close on {job.closing_date}.</p>
      <form onSubmit={submit} noValidate>
        <p>
          <label>
            Full name{" "}
            <input
              value={f.full_name}
              onChange={(e) => setF({ ...f, full_name: e.target.value })}
            />
          </label>
        </p>
        <p>
          <label>
            Email{" "}
            <input
              type="email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          </label>
        </p>
        <p>
          <label>
            Phone{" "}
            <input
              value={f.phone}
              onChange={(e) => setF({ ...f, phone: e.target.value })}
            />
          </label>
        </p>
        <p>
          <label>
            CV (PDF or DOCX, up to 5 MB)
            <br />
            <input type="file" accept=".pdf,.docx" onChange={pickFile} />
          </label>
        </p>
        {fileErr && <p role="alert">{fileErr}</p>}
        {file && !fileErr && (
          <p>
            <small>Selected: {file.name}</small>
          </p>
        )}

        <section className="my-4 border p-4">
          <p className="whitespace-pre-wrap">{notice.body}</p>
          <p>
            <small>Notice version: {notice.version}</small>
          </p>
          <p>
            <label>
              <input
                type="radio"
                name="consent"
                checked={consent === "yes"}
                onChange={() => setConsent("yes")}
              />{" "}
              Yes, I agree to AI-assisted screening
            </label>
          </p>
          <p>
            <label>
              <input
                type="radio"
                name="consent"
                checked={consent === "no"}
                onChange={() => setConsent("no")}
              />{" "}
              No, I prefer manual review only
            </label>
          </p>
        </section>

        {errors.length > 0 && (
          <ul role="alert">
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
        <button disabled={busy}>
          {busy ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </main>
  );
}

export default function Page() {
  return (
    <RoleGuard allow={["candidate"]}>
      <Suspense fallback={<p className="p-8">Loading…</p>}>
        <ApplyForm />
      </Suspense>
    </RoleGuard>
  );
}
