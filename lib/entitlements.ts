type ModuleKey = "eligia" | "studio";

const FREE_ELIGIA_EMAILS = new Set(["daties.contact@gmail.com"]);

export function normalizeEmail(email: string | null | undefined) {
  return String(email ?? "").trim().toLowerCase();
}

export function hasFreeEligiaAccess(email: string | null | undefined) {
  return FREE_ELIGIA_EMAILS.has(normalizeEmail(email));
}

export function getFreeModules(email: string | null | undefined): ModuleKey[] {
  return hasFreeEligiaAccess(email) ? ["eligia"] : [];
}
