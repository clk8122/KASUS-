"use client";

import { ArrowRight, Check, RotateCcw, Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnalysisLoader } from "@/components/eligia/AnalysisLoader";
import { ApplicantRole, HousingStatus, WorkStatus, getDocumentRules, housingStatusLabels, workStatusLabels } from "@/data/rental-documents";
import { validateUploadFile } from "@/lib/document-processing";
import { ACCOUNT_STORAGE_KEY, defaultAccountState } from "@/lib/account-store";
import { EligiaAnalysisReport, EligiaMvpDossier, EligiaMvpPerson, readEligiaDossiers, saveEligiaDossier } from "@/lib/eligia-mvp";
import { RentalApplicant, RentalDossier, applicantFullName, buildFallbackEligiaReport, buildLocalAnalysis, createApplicant } from "@/lib/rental-flow";

type PortalStep = "intro" | "tenant-count" | "profile" | "guarantor-choice" | "guarantor-count" | "documents" | "missing" | "analysis" | "contact" | "result";

type StoredCandidateState = {
  step: PortalStep;
  address: string;
  rent: number;
  applicants: RentalApplicant[];
  submitted: boolean;
};

type CandidateFile = {
  id: string;
  applicantId: string;
  roleLabel: string;
  roleIndex: number;
  file: File;
};

const workChoices: WorkStatus[] = ["cdi", "cdd", "civil-servant", "self-employed", "micro-entrepreneur", "retired", "job-seeker", "rsa", "student", "apprentice", "other"];
const housingChoices: HousingStatus[] = ["tenant", "owner", "hosted", "unknown"];

function storageKey(id: string) {
  return `eligia-candidate-portal-${id || "pending"}`;
}

// L'état du portail vit en localStorage : le serveur ne peut pas le connaître.
// Ce store garantit un premier rendu identique côté serveur et client
// (écran de préparation), puis bascule sur l'état réel une fois monté.
const emptySubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function defaultState(dossier: EligiaMvpDossier | null): StoredCandidateState {
  return {
    step: "intro",
    address: dossier?.address ?? "",
    rent: dossier?.rent ?? 0,
    applicants: [createApplicant("tenant")],
    submitted: false
  };
}

function buildMissingDocuments(applicants: RentalApplicant[]) {
  return applicants.flatMap((applicant) => {
    const expected = getDocumentRules(applicant.role, applicant.workStatus, applicant.housingStatus);
    if (applicant.documents.length >= expected.length) return [];
    return expected.slice(applicant.documents.length).map((rule) => `${applicantFullName(applicant)}: ${rule.label}`);
  });
}

function createPeople(applicants: RentalApplicant[]): EligiaMvpPerson[] {
  return applicants.map((applicant) => ({
    id: applicant.id,
    name: applicantFullName(applicant),
    role: applicant.role === "tenant" ? "Locataire" : "Garant",
    documents: applicant.documents.map((document) => document.name),
    situation: `${workStatusLabels[applicant.workStatus]} - ${housingStatusLabels[applicant.housingStatus]}`,
    monthlyIncome: applicant.monthlyIncome,
    incomeRatio: 0,
    warnings: []
  }));
}

export function CandidatePortalFlow() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const dossierId = params.get("dossier") ?? "pending";
  const [agencyName] = useState(() => {
    if (typeof window === "undefined") return defaultAccountState.agencyName;
    try {
      const stored = JSON.parse(window.localStorage.getItem(ACCOUNT_STORAGE_KEY) ?? "null") as { agencyName?: string } | null;
      return stored?.agencyName?.trim() || defaultAccountState.agencyName;
    } catch {
      return defaultAccountState.agencyName;
    }
  });
  const [agencyDossier] = useState<EligiaMvpDossier | null>(() => {
    if (typeof window === "undefined") return null;
    return readEligiaDossiers().find((item) => item.id === dossierId) ?? null;
  });
  const [state, setState] = useState<StoredCandidateState>(() => {
    if (typeof window === "undefined") return defaultState(null);
    const dossier = readEligiaDossiers().find((item) => item.id === dossierId) ?? null;
    const stored = window.localStorage.getItem(storageKey(dossierId));
    return stored ? JSON.parse(stored) as StoredCandidateState : defaultState(dossier);
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<CandidateFile[]>([]);
  const [detectedPeople, setDetectedPeople] = useState<EligiaMvpPerson[]>([]);
  const [analysisReport, setAnalysisReport] = useState<EligiaAnalysisReport | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    window.localStorage.setItem(storageKey(dossierId), JSON.stringify(state));
  }, [dossierId, state]);

  const analysis = useMemo<RentalDossier>(() => ({
    address: state.address,
    rent: state.rent,
    applicants: state.applicants
  }), [state.address, state.applicants, state.rent]);
  const localAnalysis = useMemo(() => buildLocalAnalysis(analysis), [analysis]);
  const activeApplicant = state.applicants[activeIndex] ?? state.applicants[0];
  const expectedDocs = activeApplicant ? getDocumentRules(activeApplicant.role, activeApplicant.workStatus, activeApplicant.housingStatus) : [];
  const activeRoleLabel = activeApplicant?.role === "tenant" ? "Locataire" : "Garant";
  const sameRoleIndex = state.applicants.slice(0, activeIndex + 1).filter((applicant) => applicant.role === activeApplicant?.role).length;
  const sameRoleTotal = state.applicants.filter((applicant) => applicant.role === activeApplicant?.role).length;

  function patchState(updates: Partial<StoredCandidateState>) {
    setState((current) => ({ ...current, ...updates }));
  }

  function updateApplicant(id: string, updates: Partial<RentalApplicant>) {
    patchState({
      applicants: state.applicants.map((applicant) => applicant.id === id ? { ...applicant, ...updates } : applicant)
    });
  }

  function setTenantCount(count: number) {
    patchState({
      applicants: [
        ...Array.from({ length: count }, () => createApplicant("tenant")),
        ...state.applicants.filter((applicant) => applicant.role === "guarantor")
      ],
      step: "profile"
    });
    setActiveIndex(0);
  }

  function setGuarantors(enabled: boolean) {
    const tenants = state.applicants.filter((applicant) => applicant.role === "tenant");
    patchState({
      applicants: tenants,
      step: enabled ? "guarantor-count" : "documents"
    });
    setActiveIndex(0);
  }

  function setGuarantorCount(count: number) {
    const tenants = state.applicants.filter((applicant) => applicant.role === "tenant");
    patchState({
      applicants: [...tenants, ...Array.from({ length: count }, () => createApplicant("guarantor"))],
      step: "profile"
    });
    setActiveIndex(tenants.length);
  }

  function nextProfile() {
    if (activeIndex < state.applicants.length - 1) {
      setActiveIndex((current) => current + 1);
      return;
    }
    const hasGuarantor = state.applicants.some((applicant) => applicant.role === "guarantor");
    patchState({ step: hasGuarantor ? "documents" : "guarantor-choice" });
    setActiveIndex(0);
  }

  function reset() {
    const fresh = defaultState(agencyDossier);
    setState(fresh);
    setActiveIndex(0);
    setMissing([]);
    setProgress(0);
    setUploadedFiles([]);
    setDetectedPeople([]);
    setAnalysisReport(null);
    setAnalysisError("");
    window.localStorage.removeItem(storageKey(dossierId));
  }

  function saveLater() {
    window.localStorage.setItem(storageKey(dossierId), JSON.stringify(state));
    setSavedNotice("Votre dossier est enregistré sur cet appareil. Vous pouvez revenir avec le même lien.");
    window.setTimeout(() => setSavedNotice(""), 4000);
  }

  function checkBeforeSubmit() {
    const pending = buildMissingDocuments(state.applicants);
    setMissing(pending);
    patchState({ step: "analysis" });
    void runDocumentAnalysis(pending);
  }

  async function runDocumentAnalysis(currentMissing: string[]) {
    setAnalysisError("");
    setProgress(8);
    const loadingSteps = [
      { progress: 22 },
      { progress: 42 },
      { progress: 64 },
      { progress: 82 }
    ];
    const timers = loadingSteps.map((item, index) => window.setTimeout(() => {
      setProgress(item.progress);
    }, (index + 1) * 900));
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 60000);

    try {
      const formData = new FormData();
      formData.append("address", state.address);
      formData.append("rent", String(state.rent));
      uploadedFiles.forEach((item) => {
        formData.append("files", item.file, `${item.roleLabel} ${item.roleIndex} - ${item.file.name}`);
      });

      const response = await fetch("/api/eligia/analyze-documents", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failure?.error || "Analyse impossible");
      }
      const payload = (await response.json()) as { people: EligiaMvpPerson[]; report: EligiaAnalysisReport };
      const fallbackPeople = createPeople(state.applicants);
      const people = payload.people.length ? payload.people : fallbackPeople;
      setDetectedPeople(people.map((person, index) => ({
        ...person,
        id: person.id || `detected-${index}`,
        role: person.role || fallbackPeople[index]?.role || "Locataire"
      })));
      setAnalysisReport({
        ...payload.report,
        missingDocuments: Array.from(new Set([...(payload.report.missingDocuments ?? []), ...currentMissing]))
      });
      setProgress(100);
      patchState({ step: "contact" });
    } catch {
      const fallbackPeople = createPeople(state.applicants);
      setDetectedPeople(fallbackPeople.map((person, index) => ({
        ...person,
        id: person.id || `fallback-${index}`
      })));
      setAnalysisReport(buildFallbackEligiaReport(analysis, currentMissing));
      setProgress(100);
      patchState({ step: "contact" });
    } finally {
      window.clearTimeout(timeout);
      timers.forEach(window.clearTimeout);
    }
  }

  function submitAnyway() {
    patchState({ step: "analysis" });
    void runDocumentAnalysis(missing);
  }

  function finish() {
    const people = detectedPeople.length ? detectedPeople : createPeople(state.applicants);
    const report = analysisReport;
    const localReport = buildLocalAnalysis(analysis);
    const completeness = report?.completeness ?? Math.min(100, Math.round((state.applicants.reduce((sum, applicant) => sum + applicant.documents.length, 0) / Math.max(1, state.applicants.length * 6)) * 100));
    const updated: EligiaMvpDossier = {
      id: agencyDossier?.id ?? dossierId,
      address: state.address,
      rent: state.rent,
      candidates: people.filter((person) => person.role === "Locataire").map((person) => person.name).join(", ") || "Candidat",
      status: "Analyse terminée",
      completeness,
      indicator: report?.label ?? localReport.solvencyLabel,
      link: agencyDossier?.link ?? window.location.href,
      createdAt: agencyDossier?.createdAt ?? new Date().toISOString(),
      source: "link",
      files: state.applicants.flatMap((applicant) => applicant.documents.map((document) => document.name)),
      people,
      summary: report?.humanSummary ?? report?.executiveSummary ?? localReport.summary,
      report: report ?? {
        score: localReport.solvencyScore,
        label: localReport.solvencyLabel,
        completeness,
        executiveSummary: localReport.summary,
        solvencySummary: localReport.summary,
        documentSummary: missing.length ? `Pièces manquantes : ${missing.join(", ")}` : "Les pièces attendues ont été transmises ou le candidat a choisi de soumettre le dossier en l'état.",
        missingDocuments: missing,
        inconsistencies: localReport.warnings ?? [],
        strengths: localReport.solvencyScore >= 58 ? ["Dossier exploitable pour une première lecture agence."] : [],
        riskPoints: localReport.warnings ?? [],
        recommendation: localReport.solvencyScore >= 58 ? "Transmettre à l'agence pour vérification finale." : `Dossier fragile. Loyer maximum estimé : ${localReport.maxEligibleRent ?? 0} EUR.`,
        source: "local"
      }
    };
    saveEligiaDossier(updated);
    patchState({ step: "result", submitted: true });
  }

  if (!hydrated) {
    return (
      <section className="candidate-flow glass">
        <div className="candidate-question">
          <span className="skeleton skeleton-badge" />
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-line" />
        </div>
      </section>
    );
  }

  if (!activeApplicant) return null;

  return (
    <section className="candidate-flow glass">
      <div className="candidate-flow-top">
        <div>
          <p className="candidate-brand">ELIGIA <span>x</span> {agencyName}</p>
          <h1>{state.address || "Dossier candidat"}</h1>
          <p>Ce lien reste actif 10 jours. Chaque locataire ou garant peut ajouter ses pièces.</p>
        </div>
        <span className="badge badge-green">Lien actif</span>
      </div>

      {state.step === "intro" ? (
        <div className="candidate-question">
          <h2>Présentez-vous</h2>
          <p>Répondez à quelques questions. Nous demanderons seulement les pièces utiles.</p>
          <button className="btn btn-primary" onClick={() => patchState({ step: "tenant-count" })} type="button">Commencer <ArrowRight size={18} /></button>
        </div>
      ) : null}

      {state.step === "tenant-count" ? (
        <div className="candidate-question">
          <h2>Combien de locataires pour ce logement ?</h2>
          <div className="choice-chips">
            {[1, 2, 3, 4].map((count) => <button key={count} onClick={() => setTenantCount(count)} type="button">{count}</button>)}
          </div>
          <button className="btn" onClick={() => setTenantCount(1)} type="button">Passer sans répondre</button>
        </div>
      ) : null}

      {state.step === "guarantor-choice" ? (
        <div className="candidate-question">
          <h2>Avez-vous des garants ?</h2>
          <div className="question-actions">
            <button className="btn btn-primary" onClick={() => setGuarantors(true)} type="button">Oui</button>
            <button className="btn" onClick={() => setGuarantors(false)} type="button">Non</button>
          </div>
          <button className="btn" onClick={() => patchState({ step: "documents" })} type="button">Passer cette question</button>
        </div>
      ) : null}

      {state.step === "guarantor-count" ? (
        <div className="candidate-question candidate-step-panel">
          <span className="candidate-step-kicker">Garants</span>
          <h2>Combien de garants participent au dossier ?</h2>
          <div className="choice-chips choice-chips-large">
            {[1, 2, 3, 4].map((count) => <button key={count} onClick={() => setGuarantorCount(count)} type="button">{count}</button>)}
          </div>
          <button className="btn" onClick={() => setGuarantors(false)} type="button">Finalement, pas de garant</button>
        </div>
      ) : null}

      {state.step === "profile" ? (
        <div className="candidate-question candidate-step-panel" key={`${activeApplicant.id}-${activeIndex}`}>
          <div className="candidate-person-hero">
            <span>{activeRoleLabel}</span>
            <strong>{sameRoleIndex}</strong>
            <small>sur {sameRoleTotal}</small>
          </div>
          <h2>Quelle est la situation du {activeRoleLabel.toLowerCase()} {sameRoleIndex} ?</h2>
          <div className="choice-chips">
            {workChoices.map((value) => <button className={activeApplicant.workStatus === value ? "selected" : ""} key={value} onClick={() => updateApplicant(activeApplicant.id, { workStatus: value })} type="button">{workStatusLabels[value]}</button>)}
          </div>
          <h3>Votre habitation actuelle</h3>
          <div className="choice-chips">
            {housingChoices.map((value) => <button className={activeApplicant.housingStatus === value ? "selected" : ""} key={value} onClick={() => updateApplicant(activeApplicant.id, { housingStatus: value })} type="button">{housingStatusLabels[value]}</button>)}
          </div>
          <div className="question-actions">
            <button className="btn btn-primary" onClick={nextProfile} type="button">Question suivante <ArrowRight size={18} /></button>
            <button className="btn" onClick={nextProfile} type="button">Passer sans répondre</button>
          </div>
        </div>
      ) : null}

      {state.step === "documents" ? (
        <div className="candidate-documents">
          <div className="panel-heading">
            <div>
              <p className="page-kicker">Pièces à transmettre</p>
              <h2>{applicantFullName(activeApplicant)}</h2>
            </div>
            <button className="btn btn-compact" onClick={() => patchState({ step: "profile" })} type="button">Modifier ce profil</button>
          </div>
          <div className="candidate-tabs">
            {state.applicants.map((applicant, index) => (
              <button className={index === activeIndex ? "selected" : ""} key={applicant.id} onClick={() => setActiveIndex(index)} type="button">
                {applicant.role === "tenant" ? "Locataire" : "Garant"} {index + 1}
              </button>
            ))}
          </div>
          <div className="required-docs">
            <h3>Liste personnalisée</h3>
            {expectedDocs.map((rule) => <span key={rule.id}>{rule.label}</span>)}
          </div>
          <label className="upload-zone compact-upload">
            <Upload size={24} />
            <strong>Téléverser les fichiers de cette personne</strong>
            <input
              multiple
              onChange={(event) => {
                const selected = Array.from(event.target.files ?? [])
                  .map((file) => ({ file, validation: validateUploadFile(file) }))
                  .filter((item) => item.validation.ok);
                const roleIndex = state.applicants.slice(0, activeIndex + 1).filter((applicant) => applicant.role === activeApplicant.role).length;
                const roleLabel = activeApplicant.role === "tenant" ? "Locataire" : "Garant";
                const docs = selected.map(({ file, validation }) => ({ id: `${Date.now()}-${validation.message}`, name: validation.message, size: file.size }));
                setUploadedFiles((current) => [
                  ...current,
                  ...selected.map(({ file }, index) => ({
                    id: docs[index].id,
                    applicantId: activeApplicant.id,
                    roleLabel,
                    roleIndex,
                    file
                  }))
                ]);
                updateApplicant(activeApplicant.id, { documents: [...activeApplicant.documents, ...docs] });
              }}
              style={{ display: "none" }}
              type="file"
            />
          </label>
          <div className="document-pills">
            {activeApplicant.documents.map((document) => <span key={document.id}><Check size={14} /> {document.name}</span>)}
          </div>
          <div className="question-actions">
            <button className="btn" onClick={reset} type="button"><RotateCcw size={18} /> Recommencer à zéro</button>
            <button className="btn" onClick={saveLater} type="button">Enregistrer et continuer plus tard</button>
            <button className="btn btn-primary" onClick={checkBeforeSubmit} type="button">Soumettre ma demande <ArrowRight size={18} /></button>
          </div>
          {savedNotice ? <p className="notice">{savedNotice}</p> : null}
        </div>
      ) : null}

      {state.step === "missing" ? (
        <div className="candidate-question">
          <h2>Il manque encore des pièces</h2>
          <div className="report-list">
            {missing.map((item) => <span key={item}>{item}</span>)}
          </div>
          <div className="question-actions">
            <button className="btn btn-primary" onClick={() => patchState({ step: "documents" })} type="button">Ajouter les pièces manquantes</button>
            <button className="btn" onClick={submitAnyway} type="button">Soumettre quand même</button>
          </div>
        </div>
      ) : null}

      {state.step === "analysis" ? (
        <div className="candidate-question">
          <AnalysisLoader
            fileCount={uploadedFiles.length || state.applicants.reduce((sum, applicant) => sum + applicant.documents.length, 0)}
            progress={progress}
          />
          {analysisError ? <p className="microcopy error-text">{analysisError}</p> : null}
          {analysisError ? <button className="btn btn-primary" onClick={() => void runDocumentAnalysis(missing)} type="button">Relancer l'analyse</button> : null}
        </div>
      ) : null}

      {state.step === "contact" ? (
        <div className="candidate-question">
          <h2>Confirmez les personnes trouvées</h2>
          <p>Ces coordonnées permettront à l'agence de vous contacter si le dossier est retenu.</p>
          <div className="applicant-builder-grid">
            {(detectedPeople.length ? detectedPeople : createPeople(state.applicants)).map((person) => (
              <article className="person-mini" key={person.id}>
                <div className="role-toggle">
                  <button className={person.role === "Locataire" ? "selected" : ""} onClick={() => setDetectedPeople((current) => current.map((item) => item.id === person.id ? { ...item, role: "Locataire" } : item))} type="button">Locataire</button>
                  <button className={person.role === "Garant" ? "selected" : ""} onClick={() => setDetectedPeople((current) => current.map((item) => item.id === person.id ? { ...item, role: "Garant" } : item))} type="button">Garant</button>
                </div>
                <input className="input" placeholder="Prénom Nom" value={person.name} onChange={(event) => setDetectedPeople((current) => current.map((item) => item.id === person.id ? { ...item, name: event.target.value } : item))} />
                <input className="input" placeholder="Téléphone (facultatif)" />
                <input className="input" placeholder="Email (facultatif)" />
                {person.documents.length ? <p className="microcopy">{person.documents.slice(0, 3).join(", ")}</p> : null}
              </article>
            ))}
          </div>
          <button className="btn btn-primary" onClick={finish} type="button">Voir ma pré-réponse <ArrowRight size={18} /></button>
          <button className="btn" onClick={finish} type="button">Passer cette étape</button>
        </div>
      ) : null}

      {state.step === "result" ? (
        <div className="candidate-question">
          <span className={(analysisReport?.score ?? localAnalysis.solvencyScore) >= 58 ? "badge badge-green" : "badge badge-red"}>{analysisReport?.label ?? localAnalysis.solvencyLabel}</span>
          <p className="microcopy">
            {analysisReport?.source === "openai" ? "Analyse IA OpenAI" : "Analyse de secours locale"}
          </p>
          <h2>{(analysisReport?.score ?? localAnalysis.solvencyScore) >= 58 ? "Votre dossier a été transmis à l'agence" : "Votre dossier semble insuffisant"}</h2>
          {(analysisReport?.score ?? localAnalysis.solvencyScore) < 58 ? <p>Selon les pièces transmises, votre dossier ne semble pas atteindre les critères attendus. L'agence garde la décision finale.</p> : null}
          <p>L'agence vous contactera au plus vite. Ce lien est maintenant finalisé.</p>
          <button className="btn btn-primary" onClick={() => window.close()} type="button">Fermer la page</button>
        </div>
      ) : null}
    </section>
  );
}
