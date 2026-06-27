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
  /** Renseigné uniquement quand source === "local" : explique pourquoi l'analyse IA n'a pas pu s'exécuter. */
  fallbackReason?: string;
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

/**
 * Résolution centralisée des identifiants de dossier.
 * Deux sources coexistent et ne doivent jamais être confondues :
 * - "local"  : dossiers créés sur cet appareil (préfixe `created-`), stockés en localStorage.
 * - "remote" : dossiers enregistrés côté serveur (UUID Supabase).
 * Tout identifiant qui ne correspond à aucune des deux formes est explicitement invalide.
 */
export type DossierRef =
  | { kind: "local"; id: string }
  | { kind: "remote"; id: string }
  | { kind: "invalid"; id: string; reason: string };

const localDossierIdPattern = /^created-\d+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createLocalDossierId() {
  return `created-${Date.now()}`;
}

export function isLocalDossierId(id: string) {
  return localDossierIdPattern.test(id);
}

export function isRemoteDossierId(id: string) {
  return uuidPattern.test(id);
}

export function resolveDossierRef(rawId: unknown): DossierRef {
  const id = String(rawId ?? "").trim();
  if (!id) return { kind: "invalid", id, reason: "Identifiant de dossier vide." };
  if (isLocalDossierId(id)) return { kind: "local", id };
  if (isRemoteDossierId(id)) return { kind: "remote", id };
  return { kind: "invalid", id, reason: `Identifiant de dossier non reconnu: "${id}".` };
}

export function buildCandidateLink(id: string) {
  if (typeof window === "undefined") return `/candidat/lien?dossier=${id}`;
  return `${window.location.origin}/candidat/lien?dossier=${id}`;
}

function isStoredDossierShape(value: unknown): value is EligiaMvpDossier {
  if (!value || typeof value !== "object") return false;
  const dossier = value as Partial<EligiaMvpDossier>;
  return typeof dossier.id === "string" && dossier.id.length > 0 && typeof dossier.address === "string";
}

export function readEligiaDossiers(): EligiaMvpDossier[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(eligiaDossiersStorageKey);
    if (!raw) return [];
    const stored = JSON.parse(raw) as unknown;
    if (!Array.isArray(stored)) {
      console.warn("[eligia] Stockage local des dossiers corrompu (forme inattendue). Réinitialisation.");
      window.localStorage.removeItem(eligiaDossiersStorageKey);
      return [];
    }
    return stored.filter(isStoredDossierShape);
  } catch (error) {
    console.warn("[eligia] Lecture du stockage local impossible.", error);
    return [];
  }
}

export function writeEligiaDossiers(dossiers: EligiaMvpDossier[]) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(eligiaDossiersStorageKey, JSON.stringify(dossiers));
    return true;
  } catch (error) {
    console.warn("[eligia] Écriture du stockage local impossible (quota ou navigation privée).", error);
    return false;
  }
}

export function findEligiaDossier(id: string): EligiaMvpDossier | null {
  return readEligiaDossiers().find((item) => item.id === id) ?? null;
}

export function saveEligiaDossier(dossier: EligiaMvpDossier) {
  const existing = readEligiaDossiers().filter((item) => item.id !== dossier.id);
  return writeEligiaDossiers([dossier, ...existing]);
}

export function deleteEligiaDossier(id: string) {
  return writeEligiaDossiers(readEligiaDossiers().filter((item) => item.id !== id));
}
