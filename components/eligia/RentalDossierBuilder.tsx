"use client";

import { ArrowRight, Check, Copy, FileArchive, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { ApplicantRole, HousingStatus, WorkStatus, getDocumentRules, housingStatusLabels, workStatusLabels } from "@/data/rental-documents";
import { validateUploadFile } from "@/lib/document-processing";
import { downloadUnifiedPdf } from "@/lib/pdf-client";
import { DetectedPerson, RentalAnalysis, RentalDossier, applicantFullName, buildLocalAnalysis, createApplicant } from "@/lib/rental-flow";

const workChoices = Object.entries(workStatusLabels) as [WorkStatus, string][];
const housingChoices = Object.entries(housingStatusLabels) as [HousingStatus, string][];

type RentalDossierBuilderProps = {
  mode: "agency-upload" | "candidate";
};

export function RentalDossierBuilder({ mode }: RentalDossierBuilderProps) {
  const [dossier, setDossier] = useState<RentalDossier>({
    address: "12 rue du Parc, 54000 Nancy",
    rent: 780,
    applicants: [createApplicant("tenant")]
  });
  const [agencyStep, setAgencyStep] = useState<"upload" | "clarify">("upload");
  const [globalFiles, setGlobalFiles] = useState<{ id: string; name: string; size: number; file: File }[]>([]);
  const [detectedPeople, setDetectedPeople] = useState<DetectedPerson[]>([]);
  const [reviewedPeople, setReviewedPeople] = useState<Set<string>>(() => new Set());
  const [detectionSource, setDetectionSource] = useState<"openai" | "local" | "empty" | null>(null);
  const [candidateStep, setCandidateStep] = useState<"setup" | "details">("setup");
  const [tenantCount, setTenantCount] = useState(1);
  const [guarantorCount, setGuarantorCount] = useState(0);
  const [analysis, setAnalysis] = useState<RentalAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const localPreview = useMemo(() => buildLocalAnalysis(dossier), [dossier]);
  const publicPortal = mode === "candidate";
  const pendingDetectedPerson = detectedPeople.find((person) => !reviewedPeople.has(person.id));

  function updateApplicant(id: string, updates: Partial<RentalDossier["applicants"][number]>) {
    setDossier((current) => ({
      ...current,
      applicants: current.applicants.map((applicant) => (applicant.id === id ? { ...applicant, ...updates } : applicant))
    }));
  }

  function addApplicant(role: ApplicantRole) {
    setDossier((current) => ({ ...current, applicants: [...current.applicants, createApplicant(role)] }));
  }

  function removeApplicant(id: string) {
    setDossier((current) => ({
      ...current,
      applicants: current.applicants.length === 1 ? current.applicants : current.applicants.filter((applicant) => applicant.id !== id)
    }));
  }

  async function analyze() {
    setBusy(true);
    try {
      const response = await fetch("/api/eligia/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dossier)
      });
      setAnalysis(await response.json());
    } catch {
      setAnalysis(buildLocalAnalysis(dossier));
    } finally {
      setBusy(false);
    }
  }

  async function copySummary() {
    const summary = (analysis ?? localPreview).summary;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function reset() {
    setAnalysis(null);
    setSaved(false);
    setAgencyStep("upload");
    setCandidateStep("setup");
    setGlobalFiles([]);
    setDetectedPeople([]);
    setReviewedPeople(new Set());
    setDetectionSource(null);
    setDossier({ address: "", rent: 0, applicants: [createApplicant("tenant")] });
  }

  async function detectPeopleFromFiles() {
    setBusy(true);
    setAnalysis(null);
    try {
      const formData = new FormData();
      globalFiles.forEach((file) => formData.append("files", file.file, file.name));
      const response = await fetch("/api/eligia/detect-people", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as { people: DetectedPerson[]; source: "openai" | "local" | "empty" };
      setDetectedPeople(payload.people);
      setReviewedPeople(new Set());
      setDetectionSource(payload.source);
      setDossier((current) => ({ ...current, applicants: [] }));
      setAgencyStep("clarify");
    } catch {
      const fallback = globalFiles.map((file, index) => {
        const fullName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
        const parts = fullName.split(/\s+/);
        return {
          id: `fallback-${index}`,
          firstName: parts.slice(0, -1).join(" ") || fullName,
          lastName: parts.length > 1 ? parts.at(-1) ?? "" : "",
          fullName,
          confidence: 0.2,
          evidenceDocuments: [file.name]
        };
      });
      setDetectedPeople(fallback);
      setReviewedPeople(new Set());
      setDetectionSource("local");
      setDossier((current) => ({ ...current, applicants: [] }));
      setAgencyStep("clarify");
    } finally {
      setBusy(false);
    }
  }

  function classifyDetectedPerson(person: DetectedPerson, role: ApplicantRole | "ignore") {
    if (role !== "ignore") {
      const relatedDocuments = globalFiles
        .filter((file) => person.evidenceDocuments.some((document) => document.toLocaleLowerCase("fr-FR") === file.name.toLocaleLowerCase("fr-FR")))
        .map(({ file: _file, ...document }) => document);
      const applicant = {
        ...createApplicant(role),
        firstName: person.firstName,
        lastName: person.lastName,
        documents: relatedDocuments.length ? relatedDocuments : globalFiles.map(({ file: _file, ...document }) => document)
      };
      setDossier((current) => ({ ...current, applicants: [...current.applicants, applicant] }));
    }
    setReviewedPeople((current) => new Set(current).add(person.id));
  }

  function applyCandidateCounts() {
    const applicants = [
      ...Array.from({ length: tenantCount }, () => createApplicant("tenant")),
      ...Array.from({ length: guarantorCount }, () => createApplicant("guarantor"))
    ];
    setDossier((current) => ({ ...current, applicants }));
    setCandidateStep("details");
  }

  function markUnknown(id: string) {
    updateApplicant(id, {
      firstName: "Je ne sais pas",
      lastName: "",
      role: "tenant",
      monthlyIncome: 0,
      taxNoticeIncome: 0
    });
  }

  async function saveDossier() {
    const response = await fetch("/api/eligia/dossiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dossier)
    });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as { id?: string };
    if (payload.id) {
      window.location.href = `/eligia/dossiers/${payload.id}`;
      return;
    }
    setSaved(true);
  }

  return (
    <section className="builder-page">
      <div className="builder-heading">
        <p className="eyebrow">{publicPortal ? "Portail candidat" : "Création agence"}</p>
        <h1>{publicPortal ? "Constituez votre dossier" : "Déposez les pièces reçues"}</h1>
        <p>{publicPortal ? "Indiquez le nombre de locataires et de garants, puis complétez chaque profil." : "Téléversez toutes les pièces. Après une première lecture, vous confirmerez seulement qui est locataire ou garant."}</p>
      </div>

      <section className="glass panel builder-panel">
        <div className="split">
          <label className="field">
            Adresse du bien
            <input className="input" value={dossier.address} onChange={(event) => setDossier((current) => ({ ...current, address: event.target.value }))} />
          </label>
          <label className="field">
            Loyer charges comprises
            <input className="input" inputMode="decimal" value={dossier.rent || ""} onChange={(event) => setDossier((current) => ({ ...current, rent: Number(event.target.value) }))} />
          </label>
        </div>
      </section>

      {mode === "agency-upload" && agencyStep === "upload" ? (
        <>
          <label className="upload-zone agency-upload-zone">
            <Upload size={34} />
            <strong>Déposer toutes les pièces du dossier</strong>
            <span className="muted">PDF, JPG, PNG ou HEIC. Vous n'avez pas besoin de renseigner les noms maintenant.</span>
            <input
              multiple
              onChange={(event) => {
                const selected = Array.from(event.target.files ?? []);
                const valid = selected
                  .map((file) => ({ file, validation: validateUploadFile(file) }))
                  .filter((result) => result.validation.ok);
                setGlobalFiles(valid.map(({ file, validation }) => ({ id: `${Date.now()}-${validation.message}`, name: validation.message, size: file.size, file })));
              }}
              style={{ display: "none" }}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/jpeg,image/png,image/heic,image/heif"
            />
            {globalFiles.length ? <span className="badge badge-green">{globalFiles.length} pièce(s) ajoutée(s)</span> : null}
          </label>
          <div className="document-pills">
            {globalFiles.map((file) => <span key={file.id}><Check size={14} /> {file.name}</span>)}
          </div>
          <div className="builder-actions">
            <button className="btn btn-primary" disabled={!globalFiles.length || busy} onClick={detectPeopleFromFiles} type="button">
              {busy ? "Lecture des pièces..." : "Analyser les pièces"} <ArrowRight size={18} />
            </button>
            <button className="btn" onClick={reset} type="button"><RotateCcw size={18} /> Réinitialiser</button>
          </div>
        </>
      ) : null}

      {mode === "candidate" && candidateStep === "setup" ? (
        <section className="glass panel builder-panel">
          <div className="split">
            <label className="field">
              Nombre de locataires
              <input className="input" min={1} max={6} type="number" value={tenantCount} onChange={(event) => setTenantCount(Number(event.target.value))} />
            </label>
            <label className="field">
              Nombre de garants
              <input className="input" min={0} max={6} type="number" value={guarantorCount} onChange={(event) => setGuarantorCount(Number(event.target.value))} />
            </label>
          </div>
          <div className="builder-actions">
            <button className="btn btn-primary" onClick={applyCandidateCounts} type="button">
              Continuer <ArrowRight size={18} />
            </button>
            <button className="btn" onClick={() => setGuarantorCount(0)} type="button">Pas de garant</button>
          </div>
        </section>
      ) : null}

      {(mode === "candidate" && candidateStep === "details") || (mode === "agency-upload" && agencyStep === "clarify") ? (
        <div className="builder-actions">
          {mode === "candidate" ? <button className="btn btn-compact" onClick={() => addApplicant("tenant")} type="button"><Plus size={17} /> Ajouter un locataire</button> : null}
          {mode === "candidate" ? <button className="btn btn-compact" onClick={() => addApplicant("guarantor")} type="button"><Plus size={17} /> Ajouter un garant</button> : null}
        </div>
      ) : null}

      {mode === "agency-upload" && agencyStep === "clarify" ? (
        <section className="glass panel builder-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Qualification des personnes</p>
              <h2>Noms trouvés dans les pièces</h2>
              <p className="microcopy">
                {detectedPeople.length
                  ? `${reviewedPeople.size}/${detectedPeople.length} personne(s) qualifiée(s). Source : ${detectionSource === "openai" ? "analyse ChatGPT" : "analyse locale de secours"}.`
                  : "Aucun prénom et nom certain n'a été détecté. Vous pouvez ajouter les personnes manuellement."}
              </p>
            </div>
            <button className="btn btn-compact" onClick={() => addApplicant("tenant")} type="button"><Plus size={17} /> Ajouter manuellement</button>
          </div>
          {pendingDetectedPerson ? (
            <article className="detected-person-card">
              <div>
                <span className="badge">{Math.round(pendingDetectedPerson.confidence * 100)}% confiance</span>
                <h3>{pendingDetectedPerson.fullName}</h3>
                <p className="microcopy">Pièces où ce nom apparaît : {pendingDetectedPerson.evidenceDocuments.join(", ") || "non précisé"}</p>
              </div>
              <div className="builder-actions">
                <button className="btn btn-primary" onClick={() => classifyDetectedPerson(pendingDetectedPerson, "tenant")} type="button">Locataire</button>
                <button className="btn btn-primary" onClick={() => classifyDetectedPerson(pendingDetectedPerson, "guarantor")} type="button">Garant</button>
                <button className="btn" onClick={() => classifyDetectedPerson(pendingDetectedPerson, "ignore")} type="button">Ignorer</button>
              </div>
            </article>
          ) : detectedPeople.length ? (
            <p className="success-text">Toutes les personnes détectées ont été qualifiées.</p>
          ) : null}
        </section>
      ) : null}

      {((mode === "candidate" && candidateStep === "details") || (mode === "agency-upload" && agencyStep === "clarify")) ? <div className="applicant-builder-grid">
        {dossier.applicants.map((applicant, index) => {
          const rules = getDocumentRules(applicant.role, applicant.workStatus, applicant.housingStatus);
          return (
            <article className="glass applicant-builder-card" key={applicant.id}>
              <div className="panel-heading">
                <div>
                  <span className="badge">{applicant.role === "tenant" ? `Locataire ${index + 1}` : "Garant"}</span>
                  <h2>{applicantFullName(applicant)}</h2>
                </div>
                <button className="icon-btn" onClick={() => removeApplicant(applicant.id)} type="button"><Trash2 size={17} /></button>
              </div>
              {mode === "agency-upload" ? (
                <button className="btn btn-compact" onClick={() => markUnknown(applicant.id)} type="button">Je ne sais pas</button>
              ) : null}
              <div className="split">
                <label className="field">Prénom<input className="input" value={applicant.firstName} onChange={(event) => updateApplicant(applicant.id, { firstName: event.target.value })} /></label>
                <label className="field">Nom<input className="input" value={applicant.lastName} onChange={(event) => updateApplicant(applicant.id, { lastName: event.target.value })} /></label>
                <label className="field">Rôle<select className="input" value={applicant.role} onChange={(event) => updateApplicant(applicant.id, { role: event.target.value as ApplicantRole })}><option value="tenant">Locataire</option><option value="guarantor">Garant</option></select></label>
                <label className="field">Situation professionnelle<select className="input" value={applicant.workStatus} onChange={(event) => updateApplicant(applicant.id, { workStatus: event.target.value as WorkStatus })}>{workChoices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="field">Situation logement<select className="input" value={applicant.housingStatus} onChange={(event) => updateApplicant(applicant.id, { housingStatus: event.target.value as HousingStatus })}>{housingChoices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="field">Salaire actuel mensuel<input className="input" inputMode="decimal" value={applicant.monthlyIncome || ""} onChange={(event) => updateApplicant(applicant.id, { monthlyIncome: Number(event.target.value) })} /></label>
                <label className="field">Dernier avis d'imposition annuel<input className="input" inputMode="decimal" value={applicant.taxNoticeIncome || ""} onChange={(event) => updateApplicant(applicant.id, { taxNoticeIncome: Number(event.target.value) })} /></label>
              </div>
              <div className="required-docs">
                <h3>Pièces attendues</h3>
                {rules.map((rule) => <span key={rule.id}>{rule.label}</span>)}
              </div>
              <label className="upload-zone compact-upload">
                <Upload size={24} />
                <strong>Ajouter les pièces</strong>
                <input
                  multiple
                  onChange={(event) => {
                    const selected = Array.from(event.target.files ?? []);
                    const valid = selected.map(validateUploadFile).filter((result) => result.ok);
                    updateApplicant(applicant.id, {
                      documents: [
                        ...applicant.documents,
                        ...valid.map((result) => ({ id: `${Date.now()}-${result.message}`, name: result.message, size: 0 }))
                      ]
                    });
                  }}
                  style={{ display: "none" }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/jpeg,image/png,image/heic,image/heif"
                />
              </label>
              <div className="document-pills">
                {applicant.documents.map((document) => <span key={document.id}><Check size={14} /> {document.name}</span>)}
              </div>
            </article>
          );
        })}
      </div> : null}

      {((mode === "candidate" && candidateStep === "details") || (mode === "agency-upload" && agencyStep === "clarify")) ? <section className="solvency-card glass">
        <div>
          <p className="eyebrow">Aperçu solvabilité</p>
          <h2>{(analysis ?? localPreview).solvencyLabel}</h2>
          <p>{(analysis ?? localPreview).summary}</p>
        </div>
        <div className="solvency-score"><strong>{(analysis ?? localPreview).solvencyScore}</strong><span>/100</span></div>
      </section> : null}

      {((mode === "candidate" && candidateStep === "details") || (mode === "agency-upload" && agencyStep === "clarify")) ? <div className="builder-actions">
        <button className="btn btn-primary" disabled={busy || !dossier.address || !dossier.rent} onClick={analyze} type="button">
          <FileArchive size={18} /> {busy ? "Analyse..." : "Unifier et analyser"}
        </button>
        <button className="btn btn-primary" disabled={!dossier.address || !dossier.rent} onClick={saveDossier} type="button">
          <Check size={18} /> {saved ? "Dossier enregistré" : publicPortal ? "Transmettre à l'agence" : "Enregistrer le dossier"}
        </button>
        <button className="btn" onClick={() => downloadUnifiedPdf(dossier, analysis ?? localPreview)} type="button">Générer le PDF unifié</button>
        <button className="btn" onClick={copySummary} type="button"><Copy size={18} /> {copied ? "Résumé copié" : "Copier le résumé"}</button>
        <button className="btn" onClick={reset} type="button"><RotateCcw size={18} /> Réinitialiser</button>
      </div> : null}
    </section>
  );
}
