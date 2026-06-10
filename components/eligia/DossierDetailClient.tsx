"use client";

import { useMemo, useState } from "react";
import { Check, Clipboard, Copy, Download, FileText, Mail, ShieldCheck } from "lucide-react";
import { demoDossierDetail } from "@/lib/mock-data";

type ActivePanel = "resume" | "pieces" | "relance";

export function DossierDetailClient() {
  const [activePanel, setActivePanel] = useState<ActivePanel>("resume");
  const [copied, setCopied] = useState(false);
  const [mailCopied, setMailCopied] = useState(false);

  const missingDocuments = demoDossierDetail.people.flatMap((person) =>
    person.missing.map((document) => `${person.name}: ${document}`)
  );

  const reminderMessage = useMemo(
    () =>
      `Bonjour,\n\nPour finaliser l'étude du dossier locatif ${demoDossierDetail.address}, pouvez-vous transmettre les éléments suivants :\n- ${missingDocuments.join("\n- ")}\n\nMerci par avance.`,
    [missingDocuments]
  );

  async function copyText(text: string, kind: "summary" | "mail") {
    await navigator.clipboard.writeText(text);
    if (kind === "summary") {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      setMailCopied(true);
      window.setTimeout(() => setMailCopied(false), 1800);
    }
  }

  function downloadSummary() {
    const blob = new Blob([demoDossierDetail.summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resume-dossier-eligia.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="dossier-detail-page">
      <div className="dossier-detail-heading">
        <span className="badge badge-green">{demoDossierDetail.status}</span>
        <h1>{demoDossierDetail.address}</h1>
        <p>Loyer charges comprises : {demoDossierDetail.rent} EUR. Complétude indicative : {demoDossierDetail.completeness}%.</p>
      </div>

      <div className="person-grid">
        {demoDossierDetail.people.map((person) => (
          <article className="person-card glass" key={person.id}>
            <div className="person-card-header">
              <div>
                <span className="badge">{person.role}</span>
                <h2>{person.name}</h2>
              </div>
            </div>
            <div className="person-metrics">
              <div>
                <span>Salaire actuel</span>
                <strong>{person.monthlyIncome.toLocaleString("fr-FR")} EUR / mois</strong>
              </div>
              <div>
                <span>Dernier avis d'imposition</span>
                <strong>{person.taxNoticeIncome.toLocaleString("fr-FR")} EUR / an</strong>
              </div>
              <div>
                <span>Situation logement</span>
                <strong>{person.housingStatus}</strong>
              </div>
              <div>
                <span>Situation professionnelle</span>
                <strong>{person.situation}</strong>
              </div>
            </div>
            <div className="document-pills">
              {person.documents.map((document) => (
                <span key={document}><Check size={14} /> {document}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <section className="solvency-card glass">
        <div>
          <p className="eyebrow">Solvabilité globale</p>
          <h2>{demoDossierDetail.solvency.label}</h2>
          <p>{demoDossierDetail.solvency.details}</p>
        </div>
        <div className="solvency-score">
          <strong>{demoDossierDetail.solvency.score}</strong>
          <span>/100</span>
        </div>
      </section>

      <section className="summary-card glass">
        <div className="panel-heading">
          <div>
            <h2>Résumé complet</h2>
            <p>Message formulé pour une lecture interne, un bailleur ou une validation humaine.</p>
          </div>
          <button className="btn btn-primary btn-compact" onClick={() => copyText(demoDossierDetail.summary, "summary")} type="button">
            <Copy size={17} /> {copied ? "Copié" : "Copier"}
          </button>
        </div>
        <p>{demoDossierDetail.summary}</p>
      </section>

      <div className="dossier-toolbar">
        <button className={`btn btn-compact ${activePanel === "resume" ? "btn-primary" : ""}`} onClick={() => setActivePanel("resume")} type="button">
          <FileText size={17} /> Résumé
        </button>
        <button className={`btn btn-compact ${activePanel === "pieces" ? "btn-primary" : ""}`} onClick={() => setActivePanel("pieces")} type="button">
          <Clipboard size={17} /> Pièces
        </button>
        <button className={`btn btn-compact ${activePanel === "relance" ? "btn-primary" : ""}`} onClick={() => setActivePanel("relance")} type="button">
          <Mail size={17} /> Relance
        </button>
        <button className="btn btn-compact" onClick={downloadSummary} type="button">
          <Download size={17} /> Telecharger
        </button>
      </div>

      <section className="glass panel dossier-panel">
        {activePanel === "resume" ? (
          <>
            <h2>Lecture rapide</h2>
            <p className="muted">{demoDossierDetail.summary}</p>
          </>
        ) : null}
        {activePanel === "pieces" ? (
          <>
            <h2>Pièces et points à vérifier</h2>
            <div className="list">
              {missingDocuments.map((document) => (
                <span className="badge badge-red" key={document}>{document}</span>
              ))}
            </div>
          </>
        ) : null}
        {activePanel === "relance" ? (
          <>
            <div className="panel-heading">
              <div>
                <h2>Message de relance</h2>
                <p className="muted">Prêt à copier dans un e-mail.</p>
              </div>
              <button className="btn btn-compact" onClick={() => copyText(reminderMessage, "mail")} type="button">
                <ShieldCheck size={17} /> {mailCopied ? "Copié" : "Copier le message"}
              </button>
            </div>
            <pre className="message-preview">{reminderMessage}</pre>
          </>
        ) : null}
      </section>
    </section>
  );
}
