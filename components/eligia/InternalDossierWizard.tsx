"use client";

import { ArrowLeft, ArrowRight, Check, FileArchive, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { AnalysisLoader } from "@/components/eligia/AnalysisLoader";
import { validateUploadFile } from "@/lib/document-processing";
import { buildCandidateLink, createLocalDossierId, EligiaAnalysisReport, EligiaMvpPerson, saveEligiaDossier } from "@/lib/eligia-mvp";
import { buildFallbackEligiaReport, applicantFullName, createApplicant } from "@/lib/rental-flow";

type Step = "address" | "rent" | "files" | "confirm" | "done";

type StoredFile = {
  id: string;
  name: string;
  size: number;
  file: File;
};

export function InternalDossierWizard() {
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("");
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [createdLink, setCreatedLink] = useState("");
  const [analysisLabel, setAnalysisLabel] = useState("");
  const [error, setError] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [pendingPeople, setPendingPeople] = useState<EligiaMvpPerson[]>([]);
  const [pendingReport, setPendingReport] = useState<EligiaAnalysisReport | null>(null);

  const progress = useMemo(() => {
    const order: Step[] = ["address", "rent", "files", "confirm", "done"];
    return Math.round(((order.indexOf(step) + 1) / order.length) * 100);
  }, [step]);

  function previous() {
    if (step === "rent") setStep("address");
    if (step === "files") setStep("rent");
  }

  async function analyzeFiles() {
    setBusy(true);
    setError("");
    setAnalysisProgress(10);
    const loadingSteps = [
      { progress: 28 },
      { progress: 48 },
      { progress: 68 },
      { progress: 86 }
    ];
    const timers = loadingSteps.map((item, index) => window.setTimeout(() => {
      setAnalysisProgress(item.progress);
    }, (index + 1) * 850));
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 60000);
    try {
      const formData = new FormData();
      formData.append("address", address);
      formData.append("rent", rent);
      files.forEach((file) => formData.append("files", file.file, file.name));
      const response = await fetch("/api/eligia/analyze-documents", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failure?.error || "L'analyse n'a pas pu aboutir. Veuillez verifier les fichiers puis relancer.");
      }
      const payload = (await response.json()) as { people: EligiaMvpPerson[]; report: EligiaAnalysisReport };
      setPendingPeople(payload.people);
      setPendingReport(payload.report);
      setAnalysisProgress(100);
      setStep("confirm");
    } catch {
      const fallbackApplicant = {
        ...createApplicant("tenant"),
        documents: files.map((file) => ({ id: file.id, name: file.name, size: file.size }))
      };
      const fallbackPeople: EligiaMvpPerson[] = [
        {
          id: "fallback-tenant-1",
          name: applicantFullName(fallbackApplicant),
          role: "Locataire",
          documents: files.map((file) => file.name),
          situation: "Analyse locale utilisee",
          housingStatus: "A confirmer",
          monthlyIncome: 0,
          taxNoticeIncome: 0,
          incomeRatio: 0,
          warnings: ["L'analyse serveur n'a pas repondu. Un compte rendu local a ete genere."]
        }
      ];
      setPendingPeople(fallbackPeople);
      setPendingReport(buildFallbackEligiaReport({
        address,
        rent: Number(rent),
        applicants: [fallbackApplicant]
      }));
      setAnalysisProgress(100);
      setStep("confirm");
    } finally {
      window.clearTimeout(timeout);
      timers.forEach(window.clearTimeout);
      setBusy(false);
    }
  }

  function finish(people: EligiaMvpPerson[], report: EligiaAnalysisReport) {
    const id = createLocalDossierId();
    const link = buildCandidateLink(id);
    const candidates = people.filter((person) => person.role === "Locataire").map((person) => person.name).join(", ") || "À qualifier";
    const completeness = Math.round(report.completeness);
    saveEligiaDossier({
      id,
      address,
      rent: Number(rent),
      candidates,
      status: "Analyse terminée",
      completeness,
      indicator: report.label,
      link,
      createdAt: new Date().toISOString(),
      source: "agency-upload",
      files: files.map((file) => file.name),
      people,
      summary: report.executiveSummary,
      report
    });
    setCreatedId(id);
    setCreatedLink(link);
    setAnalysisLabel(report.label);
    setStep("done");
  }

  return (
    <section className="question-flow">
      <div className="progress"><span style={{ width: `${progress}%` }} /></div>

      {step !== "address" && step !== "done" && step !== "confirm" ? (
        <button className="btn btn-compact" onClick={previous} type="button">
          <ArrowLeft size={17} /> Question précédente
        </button>
      ) : null}

      <div className="question-card glass">
        {step === "address" ? (
          <>
            <p className="page-kicker">Adresse du bien</p>
            <h1>Quel est le bien concerné ?</h1>
            <input className="question-input" onChange={(event) => setAddress(event.target.value)} placeholder="12 rue du Parc, 54000 Nancy" value={address} />
            <button className="btn btn-primary" disabled={address.trim().length < 4} onClick={() => setStep("rent")} type="button">
              Continuer <ArrowRight size={18} />
            </button>
          </>
        ) : null}

        {step === "rent" ? (
          <>
            <p className="page-kicker">Loyer</p>
            <h1>Quel est le montant du loyer ?</h1>
            <input className="question-input" inputMode="decimal" onChange={(event) => setRent(event.target.value)} placeholder="780" value={rent} />
            <button className="btn btn-primary" disabled={Number(rent) <= 0} onClick={() => setStep("files")} type="button">
              Continuer <ArrowRight size={18} />
            </button>
          </>
        ) : null}

        {step === "files" ? (
          <>
            {busy ? (
              <AnalysisLoader fileCount={files.length} progress={analysisProgress} />
            ) : (
              <>
                <p className="page-kicker">Pièces justificatives</p>
                <h1>Téléversez tous les fichiers</h1>
                <label className="upload-zone agency-upload-zone">
                  <Upload size={32} />
                  <strong>PDF, JPG, PNG ou HEIC</strong>
                  <input
                    multiple
                    onChange={(event) => {
                      const selected = Array.from(event.target.files ?? [])
                        .map((file) => ({ file, validation: validateUploadFile(file) }))
                        .filter((item) => item.validation.ok);
                      setFiles(selected.map(({ file, validation }) => ({ id: `${Date.now()}-${validation.message}`, name: validation.message, size: file.size, file })));
                    }}
                    style={{ display: "none" }}
                    type="file"
                  />
                </label>
                {files.length ? (
                  <div className="document-pills">
                    {files.map((file) => <span key={file.id}><Check size={14} /> {file.name}</span>)}
                  </div>
                ) : null}
                {error ? <p className="microcopy error-text">{error}</p> : null}
                <button className="btn btn-primary" disabled={!files.length || busy} onClick={analyzeFiles} type="button">
                  <FileArchive size={18} /> OK, analyser le dossier
                </button>
              </>
            )}
          </>
        ) : null}

        {step === "confirm" ? (
          <>
            <p className="page-kicker">Personnes détectées</p>
            <h1>Confirmez les rôles avant d'enregistrer</h1>
            <p className="muted">L'IA propose les noms trouvés dans les pièces. Vous pouvez corriger le nom et choisir Locataire ou Garant.</p>
            <div className="applicant-builder-grid">
              {pendingPeople.map((person) => (
                <article className="person-mini" key={person.id}>
                  <div className="role-toggle">
                    <button className={person.role === "Locataire" ? "selected" : ""} onClick={() => setPendingPeople((current) => current.map((item) => item.id === person.id ? { ...item, role: "Locataire" } : item))} type="button">Locataire</button>
                    <button className={person.role === "Garant" ? "selected" : ""} onClick={() => setPendingPeople((current) => current.map((item) => item.id === person.id ? { ...item, role: "Garant" } : item))} type="button">Garant</button>
                  </div>
                  <input className="input" placeholder="Prénom Nom" value={person.name} onChange={(event) => setPendingPeople((current) => current.map((item) => item.id === person.id ? { ...item, name: event.target.value } : item))} />
                  {person.situation ? <p className="microcopy">{person.situation}</p> : null}
                </article>
              ))}
            </div>
            {pendingReport ? <button className="btn btn-primary" onClick={() => finish(pendingPeople, pendingReport)} type="button">Créer le dossier agence <ArrowRight size={18} /></button> : null}
          </>
        ) : null}

        {step === "done" ? (
          <>
            <span className="badge badge-green">Dossier créé</span>
            <h1>Compte rendu prêt</h1>
            <p className="muted">{analysisLabel || "L'analyse a été enregistrée."} Le dossier est disponible dans Mes dossiers.</p>
            {createdLink ? <div className="candidate-link-box"><code>{createdLink}</code></div> : null}
            <a className="btn btn-primary" href={`/eligia/dossiers/${createdId}`}>Ouvrir le compte rendu</a>
          </>
        ) : null}
      </div>
    </section>
  );
}

