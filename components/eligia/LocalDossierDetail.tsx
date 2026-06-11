"use client";

import { AlertTriangle, Check, Copy, Link2, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { EligiaMvpDossier } from "@/lib/eligia-mvp";

type LocalDossierDetailProps = {
  dossier: EligiaMvpDossier;
};

/**
 * Fiche d'un dossier créé sur cet appareil (wizard agence ou lien candidat).
 * Ces dossiers vivent en localStorage : la fiche lit le rapport enregistré,
 * sans appel serveur.
 */
export function LocalDossierDetail({ dossier }: LocalDossierDetailProps) {
  const [copied, setCopied] = useState<"link" | "summary" | "">("");
  const report = dossier.report ?? null;
  const summary = report?.humanSummary ?? report?.executiveSummary ?? dossier.summary;

  async function copyText(text: string, kind: "link" | "summary") {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(""), 1800);
  }

  return (
    <section className="dossier-detail-page">
      <div className="dossier-detail-heading reveal">
        <div className="badge-row">
          <span className="badge">{dossier.status}</span>
          <span className="badge badge-device">Sur cet appareil</span>
        </div>
        <h1>{dossier.address || "Dossier sans adresse"}</h1>
        <p>
          Loyer charges comprises : {Math.round(dossier.rent)} EUR. Complétude indicative : {dossier.completeness}%.
        </p>
      </div>

      {report ? (
        <section className="analysis-overview glass reveal reveal-1">
          <div className="analysis-score">
            <strong>{Math.round(report.score)}</strong>
            <span>/100</span>
          </div>
          <div>
            <h2>{report.label}</h2>
            <p>{summary}</p>
          </div>
        </section>
      ) : (
        <section className="empty-state glass reveal reveal-1">
          <h2>Analyse en attente</h2>
          <p>
            Ce dossier attend les pièces du candidat. Le compte rendu apparaîtra ici dès que le dossier sera complété
            via le lien.
          </p>
        </section>
      )}

      {dossier.people.length ? (
        <div className="person-grid reveal reveal-2">
          {dossier.people.map((person) => (
            <article className="person-card glass" key={person.id}>
              <div className="person-card-header">
                <div>
                  <span className="badge">{person.role}</span>
                  <h2>{person.name || "Personne à identifier"}</h2>
                </div>
              </div>
              <div className="person-metrics">
                <div>
                  <span>Salaire mensuel</span>
                  <strong>{person.monthlyIncome ? `${person.monthlyIncome.toLocaleString("fr-FR")} EUR` : "À vérifier"}</strong>
                </div>
                <div>
                  <span>Avis d'imposition</span>
                  <strong>{person.taxNoticeIncome ? `${person.taxNoticeIncome.toLocaleString("fr-FR")} EUR / an` : "Manquant"}</strong>
                </div>
                <div>
                  <span>Situation</span>
                  <strong>{person.situation || "À confirmer"}</strong>
                </div>
                <div>
                  <span>Logement actuel</span>
                  <strong>{person.housingStatus || "À confirmer"}</strong>
                </div>
              </div>
              {person.warnings?.length ? (
                <div className="report-list">
                  {person.warnings.map((warning) => (
                    <span key={warning}><AlertTriangle size={14} /> {warning}</span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {report?.documentChecklist?.length ? (
        <section className="glass panel dossier-panel reveal reveal-3">
          <h2>Pièces du dossier</h2>
          <div className="document-checklist">
            {report.documentChecklist.map((check) => (
              <div className={`doc-check ${check.status === "present" ? "doc-check-ok" : "doc-check-missing"}`} key={check.id}>
                {check.status === "present" ? <Check size={18} /> : <X size={18} />}
                <div>
                  <strong>{check.label}</strong>
                  {check.evidenceReason ? <small>{check.evidenceReason}</small> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {report ? (
        <div className="report-grid reveal reveal-4">
          {report.strengths.length ? (
            <section className="report-panel glass">
              <h2><ShieldCheck size={20} /> Points solides</h2>
              <div className="report-list report-list-green">
                {report.strengths.map((item) => <span key={item}><Check size={14} /> {item}</span>)}
              </div>
            </section>
          ) : null}
          {report.riskPoints.length ? (
            <section className="report-panel glass">
              <h2><AlertTriangle size={20} /> Points d'attention</h2>
              <div className="report-list">
                {report.riskPoints.map((item) => <span key={item}><AlertTriangle size={14} /> {item}</span>)}
              </div>
            </section>
          ) : null}
          <section className="report-panel glass report-panel-wide">
            <div className="panel-heading">
              <div>
                <h2>Recommandation</h2>
                <p>{report.recommendation}</p>
              </div>
              <button className="btn btn-compact" onClick={() => void copyText(summary, "summary")} type="button">
                <Copy size={16} /> {copied === "summary" ? "Copié" : "Copier le résumé"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {dossier.link ? (
        <section className="glass panel candidate-link-card reveal reveal-5">
          <div className="candidate-link-head">
            <div>
              <p className="page-kicker">Lien candidat</p>
              <h2>Lien de complétion du dossier</h2>
            </div>
            <button className="btn btn-compact" onClick={() => void copyText(dossier.link, "link")} type="button">
              <Copy size={16} /> {copied === "link" ? "Copié" : "Copier"}
            </button>
          </div>
          <div className="candidate-link-box">
            <Link2 size={18} />
            <code>{dossier.link}</code>
          </div>
        </section>
      ) : null}

      <div className="dossier-action-row reveal reveal-6">
        <Link className="btn" href="/eligia/dossiers">Retour aux dossiers</Link>
      </div>
    </section>
  );
}
