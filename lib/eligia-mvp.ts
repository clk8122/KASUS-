export type EligiaMvpPerson = {
  id: string;
  name: string;
  role: "Locataire" | "Garant";
  documents: string[];
  situation?: string;
  employer?: string;
  housingStatus?: string;
  monthlyIncome?: number;
  taxNoticeIncome?: number;
  incomeRatio?: number;
  warnings?: string[];
};

export type EligiaDocumentCheck = {
  id: string;
  label: string;
  category: "Identite" | "Revenus" | "Domicile" | "Professionnel" | "Fiscalite" | "Autre";
  personName?: string;
  status: "present" | "missing";
  documentType?: string;
  evidenceReason?: string;
  evidence?: string[];
};

export type EligiaDocumentInventoryItem = {
  fileName: string;
  documentType: string;
  ownerName?: string;
  documentDate?: string;
  confidence: number;
  evidenceReason: string;
  extractedFacts?: string[];
};

export type EligiaAnalysisReport = {
  score: number;
  label: string;
  completeness: number;
  humanSummary?: string;
  ownerMessage?: string;
  executiveSummary: string;
  solvencySummary: string;
  documentSummary: string;
  documentChecklist?: EligiaDocumentCheck[];
  documentInventory?: EligiaDocumentInventoryItem[];
  missingDocuments: string[];
  inconsistencies: string[];
  strengths: string[];
  riskPoints: string[];
  recommendation: string;
  source: "openai" | "local";
};

export type EligiaMvpDossier = {
  id: string;
  address: string;
  rent: number;
  candidates: string;
  status:
    | "Lien candidat envoye"
    | "Lien candidat envoyé"
    | "Analyse terminee"
    | "Analyse terminée"
    | "Pieces a qualifier"
    | "Pièces à qualifier"
    | "Pre-analyse disponible"
    | "Pré-analyse disponible";
  completeness: number;
  indicator: string;
  link: string;
  createdAt: string;
  source: "link" | "agency-upload";
  files: string[];
  people: EligiaMvpPerson[];
  summary: string;
  report?: EligiaAnalysisReport;
};

export const eligiaDossiersStorageKey = "eligia-created-dossiers";

export function buildCandidateLink(id: string) {
  if (typeof window === "undefined") return `/candidat/lien?dossier=${id}`;
  return `${window.location.origin}/candidat/lien?dossier=${id}`;
}

export function readEligiaDossiers(): EligiaMvpDossier[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(window.localStorage.getItem(eligiaDossiersStorageKey) ?? "[]") as EligiaMvpDossier[];
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function writeEligiaDossiers(dossiers: EligiaMvpDossier[]) {
  window.localStorage.setItem(eligiaDossiersStorageKey, JSON.stringify(dossiers));
}

export function saveEligiaDossier(dossier: EligiaMvpDossier) {
  const existing = readEligiaDossiers().filter((item) => item.id !== dossier.id);
  writeEligiaDossiers([dossier, ...existing]);
}

export function deleteEligiaDossier(id: string) {
  writeEligiaDossiers(readEligiaDossiers().filter((item) => item.id !== id));
}
