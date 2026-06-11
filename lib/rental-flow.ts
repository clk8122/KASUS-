import { ApplicantRole, HousingStatus, WorkStatus, getDocumentRules, housingStatusLabels, workStatusLabels } from "@/data/rental-documents";

export type UploadedDocument = {
  id: string;
  name: string;
  size: number;
};

export type RentalApplicant = {
  id: string;
  firstName: string;
  lastName: string;
  role: ApplicantRole;
  workStatus: WorkStatus;
  housingStatus: HousingStatus;
  monthlyIncome: number;
  taxNoticeIncome: number;
  documents: UploadedDocument[];
};

export type RentalDossier = {
  address: string;
  rent: number;
  gli?: boolean;
  applicants: RentalApplicant[];
};

export type RentalAnalysis = {
  solvencyScore: number;
  solvencyLabel: string;
  globalRatio: number;
  summary: string;
  missingDocuments: string[];
  warnings?: string[];
  maxEligibleRent?: number;
  applicantSignals: Array<{
    applicantId: string;
    name: string;
    ratio: number;
    taxRatio?: number;
    status: string;
  }>;
};

export function createApplicant(role: ApplicantRole = "tenant"): RentalApplicant {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    firstName: "",
    lastName: "",
    role,
    workStatus: "cdi",
    housingStatus: "tenant",
    monthlyIncome: 0,
    taxNoticeIncome: 0,
    documents: []
  };
}

export function applicantFullName(applicant: RentalApplicant) {
  return `${applicant.firstName} ${applicant.lastName}`.trim() || (applicant.role === "tenant" ? "Locataire" : "Garant");
}

export function buildLocalAnalysis(dossier: RentalDossier): RentalAnalysis {
  const rent = dossier.rent || 1;
  const tenants = dossier.applicants.filter((applicant) => applicant.role === "tenant");
  const guarantors = dossier.applicants.filter((applicant) => applicant.role === "guarantor");
  const tenantIncome = tenants.reduce((sum, applicant) => sum + Number(applicant.monthlyIncome || 0), 0);
  const guarantorIncome = guarantors.reduce((sum, applicant) => sum + Number(applicant.monthlyIncome || 0), 0);
  const totalIncome = tenantIncome + guarantorIncome;
  const globalRatio = tenantIncome / rent;
  const guarantorRatio = guarantorIncome / rent;
  const taxMonthlyIncome = dossier.applicants.reduce((sum, applicant) => sum + Number(applicant.taxNoticeIncome || 0) / 12, 0);
  const taxRatio = taxMonthlyIncome / rent;
  const missingDocuments = dossier.applicants.flatMap((applicant) => {
    const rules = getDocumentRules(applicant.role, applicant.workStatus, applicant.housingStatus);
    const uploaded = applicant.documents.length;
    if (uploaded >= Math.min(4, rules.length)) return [];
    return rules.slice(uploaded, uploaded + 4).map((rule) => `${applicantFullName(applicant)}: ${rule.label}`);
  });

  const stableStatuses: WorkStatus[] = ["cdi", "civil-servant", "retired"];
  const acceptableIndependentStatuses: WorkStatus[] = ["self-employed", "micro-entrepreneur"];
  const fragileStatuses: WorkStatus[] = ["job-seeker", "social-benefits", "rsa"];
  const hasStableTenant = tenants.some((applicant) => stableStatuses.includes(applicant.workStatus));
  const hasIndependentTenant = tenants.some((applicant) => acceptableIndependentStatuses.includes(applicant.workStatus));
  const hasFragileTenant = tenants.some((applicant) => fragileStatuses.includes(applicant.workStatus));
  const hasStudentTenant = tenants.some((applicant) => applicant.workStatus === "student" || applicant.workStatus === "apprentice");
  const tenantPasses = globalRatio >= 3;
  const guarantorPasses = guarantorRatio >= 4;
  const taxCoherent = taxRatio >= 3 || taxMonthlyIncome === 0;
  const gliWarning = Boolean(dossier.gli && guarantors.length && !hasStudentTenant);
  const maxEligibleRent = Math.floor(Math.max(tenantIncome / 3, guarantorIncome / 4));

  const warnings = [
    !tenantPasses && guarantorPasses ? "Les revenus des locataires sont insuffisants seuls, mais les garants apportent une couverture financière solide." : "",
    gliWarning ? "Attention GLI : les garants sont généralement acceptés uniquement pour les étudiants." : "",
    hasFragileTenant && !guarantorPasses ? "Profil locataire fragile sans garant suffisamment solide." : "",
    !taxCoherent ? "L'avis d'imposition mensualise ne confirme pas le niveau de revenus attendu." : "",
    missingDocuments.length ? "Des pièces manquent ou restent à vérifier." : ""
  ].filter(Boolean);

  let score = Math.round(globalRatio * 24);
  if (tenantPasses) score += 20;
  if (guarantorPasses) score += 14;
  if (hasStableTenant) score += 14;
  if (hasIndependentTenant && taxCoherent) score += 8;
  if (taxCoherent) score += 8;
  if (missingDocuments.length) score -= Math.min(24, missingDocuments.length * 4);
  if (hasFragileTenant) score -= 18;
  if (gliWarning) score -= 12;
  const solvencyScore = Math.max(8, Math.min(96, score));
  const solvencyLabel = solvencyScore >= 78
    ? "Eligible probable"
    : solvencyScore >= 58
      ? "Éligible sous réserves"
      : "Non éligible ou dossier insuffisant";
  const applicantSignals = dossier.applicants.map((applicant) => {
    const ratio = Number(applicant.monthlyIncome || 0) / rent;
    const applicantTaxRatio = (Number(applicant.taxNoticeIncome || 0) / 12) / rent;
    return {
      applicantId: applicant.id,
      name: applicantFullName(applicant),
      ratio,
      taxRatio: applicantTaxRatio,
      status: `${applicant.role === "tenant" ? "Locataire" : "Garant"} - ${workStatusLabels[applicant.workStatus]} - ${housingStatusLabels[applicant.housingStatus]}`
    };
  });
  const summary = [
    `Le dossier concerne le logement situé ${dossier.address || "adresse non renseignée"}, avec un loyer charges comprises de ${dossier.rent || 0} EUR.`,
    `Les revenus mensuels des locataires totalisent ${tenantIncome.toLocaleString("fr-FR")} EUR pour un loyer de ${dossier.rent || 0} EUR charges comprises. Les garants totalisent ${guarantorIncome.toLocaleString("fr-FR")} EUR par mois.`,
    `Les revenus déclarés représentent ${totalIncome.toLocaleString("fr-FR")} EUR par mois. Les avis d'imposition transmis représentent environ ${taxMonthlyIncome.toLocaleString("fr-FR")} EUR par mois.`,
    `La solvabilité ressort comme : ${solvencyLabel.toLowerCase()}.`,
    tenantPasses ? "Les revenus locataires semblent suffisants pour le loyer demandé." : `Les revenus locataires semblent insuffisants. Loyer maximum estimé avec leurs revenus : ${Math.floor(tenantIncome / 3).toLocaleString("fr-FR")} EUR.`,
    guarantors.length ? (guarantorPasses ? "Les garants apportent une couverture financière solide." : "Les garants ne semblent pas assez solides pour compenser seuls le dossier.") : "",
    warnings.length ? `Points d'attention : ${warnings.join(" ")}` : "Aucun point bloquant majeur n'est détecté localement.",
    missingDocuments.length ? `Pièces ou points à compléter : ${missingDocuments.join("; ")}.` : "Les pièces principales attendues semblent présentes d'après les informations renseignées."
  ].join(" ");

  return { applicantSignals, globalRatio, maxEligibleRent, missingDocuments, solvencyLabel, solvencyScore, summary, warnings };
}
