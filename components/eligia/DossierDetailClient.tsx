"use client";

import { Check, Copy, Download, FileArchive, FileText, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/lib/use-account";
import { downloadUnifiedPdf } from "@/lib/pdf-client";
import { type RentalAnalysis, type RentalDossier } from "@/lib/rental-flow";

type DossierResponse = {
  dossier: {
    id: string;
    address: string;
    rent: number;
    status: string;
    completeness: number;
    solvency_score: number | null;
    solvency_label: string | null;
    summary: string;
    created_at: string;
  };
  applicants: Array<{
    id: string;
    first_name: string;
    last_name: string;
    role: "tenant" | "guarantor";
    work_status: string;
    housing_status: string;
    monthly_income: number;
    tax_notice_income: number;
    created_at: string;
  }>;
  documents: Array<{
    id: string;
    applicant_id: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    storage_path: string;
    created_at: string;
  }>;
};

type ActivePanel = "resume" | "pieces" | "relance";

function displayRole(role: "tenant" | "guarantor") {
  return role === "tenant" ? "Locataire" : "Garant";
}

export function DossierDetailClient({ id }: { id: string }) {
  const { sessionToken, loading } = useAccount();
  const [data, setData] = useState<DossierResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>("resume");
  const [copied, setCopied] = useState(false);
  const [mailCopied, setMailCopied] = useState(false);

  useEffect(() => {
    if (!sessionToken || loading) return;
    let mounted = true;
    queueMicrotask(() => {
      void (async () => {
        setBusy(true);
        setError("");
        try {
          const response = await fetch(`/api/eligia/dossiers/${id}`, {
            headers: {
              Authorization: `Bearer ${sessionToken}`
            }
          });
          const payload = (await response.json()) as DossierResponse & { error?: string };
          if (!response.ok) throw new Error(payload.error || "Chargement impossible.");
          if (mounted) setData(payload);
        } catch (thrown) {
          if (mounted) setError(thrown instanceof Error ? thrown.message : "Chargement impossible.");
        } finally {
          if (mounted) setBusy(false);
        }
      })();
    });
    return () => {
      mounted = false;
    };
  }, [id, loading, sessionToken]);

  const applicants = useMemo(() => data?.applicants ?? [], [data]);
  const documents = useMemo(() => data?.documents ?? [], [data]);
  const dossier = data?.dossier ?? null;

  const rentalDossier = useMemo<RentalDossier | null>(() => {
    if (!dossier) return null;
    return {
      address: dossier.address,
      rent: dossier.rent,
      applicants: applicants.map((applicant) => {
        const applicantDocs = documents
          .filter((document) => document.applicant_id === applicant.id)
          .map((document) => ({ id: document.id, name: document.file_name, size: document.size_bytes }));
        return {
          id: applicant.id,
          firstName: applicant.first_name,
          lastName: applicant.last_name,
          role: applicant.role,
          workStatus: applicant.work_status as RentalDossier["applicants"][number]["workStatus"],
          housingStatus: applicant.housing_status as RentalDossier["applicants"][number]["housingStatus"],
          monthlyIncome: applicant.monthly_income,
          taxNoticeIncome: applicant.tax_notice_income,
          documents: applicantDocs
        };
      })
    };
  }, [applicants, dossier, documents]);

  const analysis = useMemo<RentalAnalysis | null>(() => {
    if (!dossier || !rentalDossier) return null;
    return {
      solvencyScore: dossier.solvency_score ?? dossier.completeness,
      solvencyLabel: dossier.solvency_label ?? dossier.status,
      globalRatio: 0,
      summary: dossier.summary,
      missingDocuments: [],
      applicantSignals: []
    };
  }, [dossier, rentalDossier]);

  const ownerMessage = dossier
    ? [
        "Bonjour,",
        "",
        `Le dossier ${dossier.address} est disponible pour lecture.`,
        `Statut actuel : ${dossier.status}.`,
        "",
        "Bien cordialement"
      ].join("\n")
    : "";

  const reminderMessage = dossier
    ? [
        "Bonjour,",
        "",
        `Pour le dossier ${dossier.address}, merci de compléter les pièces manquantes ou d'envoyer la version finale si elle est prête.`,
        "",
        "Bien cordialement"
      ].join("\n")
    : "";

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
    if (!rentalDossier || !analysis) return;
    const blob = new Blob([analysis.summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resume-dossier-eligia.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdf() {
    if (!rentalDossier || !analysis) return;
    downloadUnifiedPdf(rentalDossier, analysis);
  }

  if (busy) {
    return <section className="empty-state glass"><p>Chargement du dossier réel...</p></section>;
  }

  if (error) {
    return <section className="empty-state glass"><p>{error}</p></section>;
  }

  if (!dossier || !rentalDossier || !analysis) {
    return (
      <section className="question-card glass">
        <h1>Dossier introuvable</h1>
        <Link className="btn btn-primary" href="/eligia/dossiers">Retour aux dossiers</Link>
      </section>
    );
  }

  return (
    <section className="dossier-detail-page">
      <div className="dossier-detail-heading">
        <span className="badge badge-green">{dossier.status}</span>
        <h1>{dossier.address}</h1>
        <p>Loyer charges comprises : {Math.round(dossier.rent)} EUR. Complétude indicative : {dossier.completeness}%.</p>
      </div>

      <div className="person-grid">
        {applicants.map((applicant) => {
          const applicantDocs = documents.filter((document) => document.applicant_id === applicant.id);
          return (
            <article className="person-card glass" key={applicant.id}>
              <div className="person-card-header">
                <div>
                  <span className="badge">{displayRole(applicant.role)}</span>
                  <h2>{[applicant.first_name, applicant.last_name].filter(Boolean).join(" ") || "Membre du dossier"}</h2>
                </div>
              </div>
              <div className="person-metrics">
                <div>
                  <span>Salaire actuel</span>
                  <strong>{applicant.monthly_income ? `${applicant.monthly_income.toLocaleString("fr-FR")} EUR / mois` : "À vérifier"}</strong>
                </div>
                <div>
                  <span>Dernier avis d'imposition</span>
                  <strong>{applicant.tax_notice_income ? `${applicant.tax_notice_income.toLocaleString("fr-FR")} EUR / an` : "Manquant"}</strong>
                </div>
                <div>
                  <span>Situation logement</span>
                  <strong>{applicant.housing_status}</strong>
                </div>
                <div>
                  <span>Situation professionnelle</span>
                  <strong>{applicant.work_status}</strong>
                </div>
              </div>
              <div className="document-pills">
                {applicantDocs.length ? applicantDocs.map((document) => (
                  <span key={document.id}><Check size={14} /> {document.file_name}</span>
                )) : <span>Aucune pièce reliée</span>}
              </div>
            </article>
          );
        })}
      </div>

      <section className="solvency-card glass">
        <div>
          <p className="eyebrow">Solvabilité globale</p>
          <h2>{analysis.solvencyLabel}</h2>
          <p>{analysis.summary}</p>
        </div>
        <div className="solvency-score">
          <strong>{analysis.solvencyScore}</strong>
          <span>/100</span>
        </div>
      </section>

      <section className="summary-card glass">
        <div className="panel-heading">
          <div>
            <h2>Résumé complet</h2>
            <p>Message formulé pour une lecture interne, un bailleur ou une validation humaine.</p>
          </div>
          <button className="btn btn-primary btn-compact" onClick={() => copyText(analysis.summary, "summary")} type="button">
            <Copy size={17} /> {copied ? "Copié" : "Copier"}
          </button>
        </div>
        <p>{analysis.summary}</p>
      </section>

      <div className="dossier-toolbar">
        <button className={`btn btn-compact ${activePanel === "resume" ? "btn-primary" : ""}`} onClick={() => setActivePanel("resume")} type="button">
          <FileText size={17} /> Résumé
        </button>
        <button className={`btn btn-compact ${activePanel === "pieces" ? "btn-primary" : ""}`} onClick={() => setActivePanel("pieces")} type="button">
          <FileArchive size={17} /> Pièces
        </button>
        <button className={`btn btn-compact ${activePanel === "relance" ? "btn-primary" : ""}`} onClick={() => setActivePanel("relance")} type="button">
          <Mail size={17} /> Relance
        </button>
        <button className="btn btn-compact" onClick={downloadSummary} type="button">
          <Download size={17} /> Télécharger
        </button>
        <button className="btn btn-compact" onClick={downloadPdf} type="button">
          PDF unifié
        </button>
      </div>

      <section className="glass panel dossier-panel">
        {activePanel === "resume" ? (
          <>
            <h2>Lecture rapide</h2>
            <p className="muted">{analysis.summary}</p>
          </>
        ) : null}
        {activePanel === "pieces" ? (
          <>
            <h2>Pièces du dossier</h2>
            <div className="document-pills">
              {documents.length ? documents.map((document) => (
                <span key={document.id}><Check size={14} /> {document.file_name}</span>
              )) : <span>Aucune pièce enregistrée</span>}
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

      <section className="glass panel dossier-panel">
        <div className="panel-heading">
          <div>
            <h2>Message propriétaire</h2>
            <p className="muted">Message simple pour signaler la disponibilité du dossier.</p>
          </div>
          <button className="btn btn-compact" onClick={() => copyText(ownerMessage, "mail")} type="button">
            <Copy size={17} /> Copier
          </button>
        </div>
        <pre className="message-preview">{ownerMessage}</pre>
      </section>
    </section>
  );
}
