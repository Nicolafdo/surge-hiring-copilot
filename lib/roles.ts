export type Role =
  | "candidate"
  | "hr"
  | "pm"
  | "hiring_manager"
  | "finance"
  | "management"
  | "interviewer"
  | "admin";

export const ROLE_LABEL: Record<Role, string> = {
  candidate: "Candidate",
  hr: "HR / Recruiter",
  pm: "Project Manager",
  hiring_manager: "Hiring Manager",
  finance: "Finance",
  management: "Management",
  interviewer: "Interviewer",
  admin: "Admin",
};

// Placeholder menus. Each link becomes a real page when its feature is built.
export const NAV: Record<Role, string[]> = {
  candidate: ["Vacancies", "My applications", "Messages"],
  hr: ["Manage vacancies", "Applications", "Shortlist", "Pipeline", "Reports"],
  pm: ["New requisition", "My requisitions"],
  finance: ["Requisitions to review"],
  hiring_manager: ["Shortlists", "Interviews", "Final decisions"],
  interviewer: ["My interviews", "My feedback"],
  management: ["Reports", "Salary exceptions"],
  admin: [],
};

export const HREF: Record<string, string> = {
  "New requisition": "/requisitions/new/",
  "My requisitions": "/requisitions/",
  "Requisitions to review": "/requisitions/",
  "Manage vacancies": "/vacancies/",
};
