"use client";

import { AlertTriangle, Check, Copy, Download, FileArchive, FileText, Home, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EligiaAnalysisReport, EligiaDocumentCheck, EligiaMvpDossier, readEligiaDossiers } from "@/lib/eligia-mvp";
import { demoDossierDetail, demoDossiers } from "@/lib/mock-data";
import { downloadUnifiedPdf } from "@/lib/pdf-client";
import { RentalAnalysis, RentalDossier } from "@/lib/rental-flow";

type MvpDossierDetailProps = {
  id: string;
};

type MessageModal = {
  title: string;
  text: string;
} | null;

type ZipEntry = {
  path: string;
  content: string;
};

function fallbackDossier(id: string): EligiaMvpDossier | null {
  const demo = demoDossiers.find((dossier) => dossier.id === id);
  if (!demo) return null;
  const report: EligiaAnalysisReport | undefined = demo.id === "demo-dossier"
    ? {
        score: demoDossierDetail.solvency.score,
        label: demoDossierDetail.solvency.label,
        completeness: demo.completeness,
        executiveSummary: demoDossierDetail.summary,
        solvencySummary: demoDossierDetail.solvency.details,
        documentSummary: "Les pièces principales sont présentes. Deux justificatifs restent à compléter avant décision.",
        documentChecklist: [
          { id: "id-camille", label: "Pièce d'identité", category: "Identite", personName: "Camille Martin", status: "present", evidence: ["Pièce d'identité"] },
          { id: "contract-camille", label: "Contrat de travail", category: "Professionnel", personName: "Camille Martin", status: "present", evidence: ["Contrat de travail"] },
          { id: "pay-camille", label: "3 bulletins de salaire", category: "Revenus", personName: "Camille Martin", status: "present", evidence: ["3 bulletins de salaire"] },
          { id: "tax-camille", label: "Dernier avis d'imposition", category: "Fiscalite", personName: "Camille Martin", status: "present", evidence: ["Dernier avis d'imposition"] },
          { id: "rent-camille", label: "Quittance de loyer récente", category: "Domicile", personName: "Camille Martin", status: "missing", evidence: [] },
          { id: "home-julien", label: "Justificatif de domicile récent du garant", category: "Domicile", personName: "Julien Martin", status: "missing", evidence: [] }
        ],
        missingDocuments: ["Quittance de loyer récente", "Justificatif de domicile récent du garant"],
        inconsistencies: [],
        strengths: ["Revenus locataire cohérents avec le loyer demandé", "Garant avec revenus confortables", "Situation professionnelle stable"],
        riskPoints: ["Vérifier les dates des justificatifs", "Confirmer les originaux avant validation"],
        recommendation: "Dossier favorable, sous réserve de compléter les deux justificatifs signalés.",
        source: "local"
      }
    : undefined;
  return {
    ...demo,
    status: demo.status as EligiaMvpDossier["status"],
    createdAt: new Date().toISOString(),
    source: demo.id === "pending-link" ? "link" : "agency-upload",
    files: demo.id === "demo-dossier" ? demoDossierDetail.people.flatMap((person) => person.documents) : [],
    people: demo.id === "demo-dossier"
      ? demoDossierDetail.people.map((person) => ({
          id: person.id,
          name: person.name,
          role: person.role as "Locataire" | "Garant",
          documents: person.documents,
          situation: person.situation,
          housingStatus: person.housingStatus,
          monthlyIncome: person.monthlyIncome,
          taxNoticeIncome: person.taxNoticeIncome,
          incomeRatio: person.rentRatio
        }))
      : [],
    summary: demo.id === "pending-link" ? "En attente du candidat." : demoDossierDetail.summary,
    report
  };
}

function safeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "dossier";
}

function categoryFolder(value?: string) {
  const category = (value ?? "").toLowerCase();
  if (category.includes("ident")) return "identite";
  if (category.includes("revenus") || category.includes("fiscal")) return "revenus";
  if (category.includes("domicile") || category.includes("hebergement")) return "hebergement";
  if (category.includes("professionnel")) return "professionnel";
  return "autres";
}

function crc32(bytes: Uint8Array) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function writeUint16(value: number) {
  return [value & 255, (value >>> 8) & 255];
}

function writeUint32(value: number) {
  return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
}

function createZip(entries: ZipEntry[]) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const contentBytes = encoder.encode(entry.content);
    const checksum = crc32(contentBytes);
    const localHeader = new Uint8Array([
      ...writeUint32(0x04034b50),
      ...writeUint16(20),
      ...writeUint16(2048),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint32(checksum),
      ...writeUint32(contentBytes.length),
      ...writeUint32(contentBytes.length),
      ...writeUint16(nameBytes.length),
      ...writeUint16(0)
    ]);
    localParts.push(localHeader, nameBytes, contentBytes);

    const centralHeader = new Uint8Array([
      ...writeUint32(0x02014b50),
      ...writeUint16(20),
      ...writeUint16(20),
      ...writeUint16(2048),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint32(checksum),
      ...writeUint32(contentBytes.length),
      ...writeUint32(contentBytes.length),
      ...writeUint16(nameBytes.length),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint32(0),
      ...writeUint32(offset)
    ]);
    centralParts.push(centralHeader, nameBytes);
    offset += localHeader.length + nameBytes.length + contentBytes.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = new Uint8Array([
    ...writeUint32(0x06054b50),
    ...writeUint16(0),
    ...writeUint16(0),
    ...writeUint16(entries.length),
    ...writeUint16(entries.length),
    ...writeUint32(centralSize),
    ...writeUint32(offset),
    ...writeUint16(0)
  ]);
  const blobParts = [...localParts, ...centralParts, endRecord].map((part) => {
    const copy = new Uint8Array(part.byteLength);
    copy.set(part);
    return copy.buffer;
  });
  return new Blob(blobParts, { type: "application/zip" });
}

export function MvpDossierDetail({ id }: MvpDossierDetailProps) {
  const [dossier] = useState<EligiaMvpDossier | null>(() => readEligiaDossiers().find((item) => item.id === id) ?? fallbackDossier(id));
  const [copied, setCopied] = useState(false);
  const [modal, setModal] = useState<MessageModal>(null);
  const [modalCopied, setModalCopied] = useState(false);

  const checklist = useMemo<EligiaDocumentCheck[]>(() => {
    if (!dossier) return [];
    if (dossier.report?.documentChecklist?.length) return dossier.report.documentChecklist;
    return [
      ...dossier.files.map((file, index) => ({
        id: `present-${index}`,
        label: file,
        category: "Autre" as const,
        personName: dossier.candidates,
        status: "present" as const,
        evidence: [file]
      })),
      ...(dossier.report?.missingDocuments ?? []).map((label, index) => ({
        id: `missing-${index}`,
        label,
        category: "Autre" as const,
        personName: dossier.candidates,
        status: "missing" as const,
        evidence: []
      }))
    ];
  }, [dossier]);

  const presentDocs = checklist.filter((item) => item.status === "present");
  const missingDocs = checklist.filter((item) => item.status === "missing");
  const ownerMessage = dossier?.report?.ownerMessage ?? dossier?.report?.humanSummary ?? dossier?.report?.executiveSummary ?? dossier?.summary ?? "";
  const missingMessage = [
    "Bonjour,",
    "",
    "Pour finaliser votre dossier locatif, il manque les pièces suivantes :",
    ...missingDocs.map((item) => `- ${item.personName ? `${item.personName} : ` : ""}${item.label}`),
    "",
    "Vous pouvez les transmettre via le lien candidat ou par retour de mail.",
    "Bien cordialement"
  ].join("\n");

  async function copyLink() {
    if (!dossier?.link) return;
    await navigator.clipboard.writeText(dossier.link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function copyModalText() {
    if (!modal) return;
    await navigator.clipboard.writeText(modal.text);
    setModalCopied(true);
    window.setTimeout(() => setModalCopied(false), 1500);
  }

  function downloadMvpPdf() {
    if (!dossier) return;
    const rentalDossier: RentalDossier = {
      address: dossier.address,
      rent: dossier.rent,
      applicants: dossier.people.map((person) => ({
        id: person.id,
        firstName: person.name.split(" ").slice(0, -1).join(" ") || person.name,
        lastName: person.name.split(" ").slice(-1).join(" "),
        role: person.role === "Locataire" ? "tenant" : "guarantor",
        workStatus: "cdi",
        housingStatus: "tenant",
        monthlyIncome: 0,
        taxNoticeIncome: 0,
        documents: person.documents.map((document, index) => ({ id: `${person.id}-${index}`, name: document, size: 0 }))
      }))
    };
    const analysis: RentalAnalysis = {
      solvencyScore: dossier.completeness,
      solvencyLabel: dossier.indicator,
      globalRatio: 0,
      summary: dossier.summary,
      missingDocuments: [],
      applicantSignals: []
    };
    downloadUnifiedPdf(rentalDossier, analysis);
  }

  function buildZipEntries(current: EligiaMvpDossier) {
    const root = `${safeName(current.candidates || "candidat")}-${safeName(current.address)}`;
    const entries: ZipEntry[] = [
      {
        path: `${root}/00-compte-rendu/resume-dossier.txt`,
        content: [
          "DOSSIER ELIGIA",
          `Adresse : ${current.address}`,
          `Loyer : ${current.rent} EUR`,
          `Candidats : ${current.candidates}`,
          `Statut : ${current.status}`,
          "",
          "Résumé",
          current.report?.humanSummary ?? current.report?.executiveSummary ?? current.summary,
          "",
          "Recommandation",
          current.report?.recommendation ?? "Aucune recommandation disponible."
        ].join("\n")
      },
      {
        path: `${root}/00-compte-rendu/pieces-manquantes.txt`,
        content: missingDocs.length
          ? missingDocs.map((item) => `${item.personName ? `${item.personName} - ` : ""}${item.label}`).join("\n")
          : "Aucune pièce manquante signalée."
      }
    ];

    for (const person of current.people) {
      const personRoot = `${root}/${safeName(person.name) || person.id}`;
      const personChecks = checklist.filter((item) => item.personName === person.name || person.documents.some((document) => item.evidence?.includes(document)));
      const docs: EligiaDocumentCheck[] = personChecks.length
        ? personChecks
        : person.documents.map((document, index) => ({
            id: `${person.id}-${index}`,
            label: document,
            category: "Autre" as EligiaDocumentCheck["category"],
            personName: person.name,
            status: "present" as const,
            evidence: [document],
            evidenceReason: "Pièce listée dans le dossier enregistré."
          }));

      entries.push({
        path: `${personRoot}/00-fiche-personne.txt`,
        content: [
          `Nom : ${person.name}`,
          `Rôle : ${person.role}`,
          `Situation : ${person.situation || "À vérifier"}`,
          `Logement : ${person.housingStatus || "À vérifier"}`,
          `Employeur : ${person.employer || "À vérifier"}`,
          `Salaire : ${person.monthlyIncome ? `${person.monthlyIncome.toLocaleString("fr-FR")} EUR/mois` : "À vérifier"}`,
          `Avis d'imposition : ${person.taxNoticeIncome ? `${person.taxNoticeIncome.toLocaleString("fr-FR")} EUR/an` : "À vérifier"}`
        ].join("\n")
      });

      docs.forEach((document, index) => {
        const folder = categoryFolder(document.category);
        const status = document.status === "present" ? "recu" : "manquant";
        entries.push({
          path: `${personRoot}/${folder}/${String(index + 1).padStart(2, "0")}-${status}-${safeName(document.label)}.txt`,
          content: [
            `Pièce : ${document.label}`,
            `Statut : ${document.status === "present" ? "Reçue" : "Manquante"}`,
            `Personne : ${document.personName || person.name}`,
            `Catégorie : ${document.category}`,
            `Fichier source : ${document.evidence?.join(", ") || "Aucun fichier source disponible dans le MVP"}`,
            document.evidenceReason ? `Contrôle : ${document.evidenceReason}` : ""
          ].filter(Boolean).join("\n")
        });
      });
    }

    return entries;
  }

  function downloadStructuredZip() {
    if (!dossier) return;
    const zip = createZip(buildZipEntries(dossier));
    const url = URL.createObjectURL(zip);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dossier-eligia-${safeName(dossier.candidates || "candidat")}-${safeName(dossier.address)}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!dossier) {
    return (
      <section className="question-card glass">
        <h1>Dossier introuvable</h1>
        <Link className="btn btn-primary" href="/eligia/dossiers">Retour aux dossiers</Link>
      </section>
    );
  }

  if (dossier.source === "link" && !dossier.people.length && !dossier.files.length) {
    return (
      <section className="dossier-detail-page">
        <div className="question-card glass">
          <span className="badge">Lien candidat envoyé</span>
          <h1>{dossier.address}</h1>
          <p className="muted">En attente du candidat.</p>
          <div className="message-preview">{dossier.link}</div>
          <button className="btn btn-primary" onClick={copyLink} type="button">
            <Copy size={18} /> {copied ? "Lien copié" : "Récupérer le lien candidat"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="dossier-detail-page">
      <div className="dossier-detail-heading">
        <span className="badge badge-green">{dossier.status}</span>
        <h1>{dossier.address}</h1>
        <p>Loyer charges comprises : {dossier.rent} EUR. Dossier complet à {dossier.completeness}%.</p>
      </div>

      <div className="profile-strip">
        {dossier.people.map((person) => (
          <article className="profile-tile dossier-person-tile glass" key={person.id}>
            <div className="person-tile-top">
              <span className="badge">{person.role}</span>
            </div>
            <h2>{person.name}</h2>
            <div className="profile-tile-grid">
              <div><small>Salaire</small><strong>{person.monthlyIncome ? `${person.monthlyIncome.toLocaleString("fr-FR")} EUR/mois` : "À vérifier"}</strong></div>
              <div><small>Avis d'impôt</small><strong>{person.taxNoticeIncome ? `${person.taxNoticeIncome.toLocaleString("fr-FR")} EUR/an` : "Manquant"}</strong></div>
              <div><small>Logement</small><strong>{person.housingStatus || "À vérifier"}</strong></div>
              <div><small>Situation</small><strong>{person.situation || person.employer || "À vérifier"}</strong></div>
            </div>
          </article>
        ))}
      </div>

      <div className="dossier-result-layout">
        <div className="dossier-result-main">
          <section className="analysis-overview glass">
            <div className="analysis-score">
              <span>Score</span>
              <strong>{Math.round(dossier.report?.score ?? dossier.completeness)}</strong>
            </div>
            <div>
              <p className="eyebrow">Résumé de situation</p>
              <h2>{dossier.report?.label ?? dossier.indicator}</h2>
              <p>{dossier.report?.humanSummary ?? dossier.report?.executiveSummary ?? dossier.summary}</p>
            </div>
          </section>

          {dossier.report?.recommendation ? (
            <section className="glass recommendation-card">
              <h2><ShieldCheck size={19} /> Recommandation</h2>
              <p>{dossier.report.recommendation}</p>
              <p className="microcopy">Compte rendu d'aide à la lecture. La décision finale reste humaine.</p>
            </section>
          ) : null}

          <section className="summary-card glass">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Actions</p>
                <h2>Messages et export</h2>
              </div>
            </div>
            <div className="dossier-action-row">
              <button className="btn btn-compact" onClick={() => setModal({ title: "Message propriétaire", text: ownerMessage })} type="button">
                Message propriétaire
              </button>
              <button className="btn btn-compact" disabled={!missingDocs.length} onClick={() => setModal({ title: "Message pièces manquantes", text: missingMessage })} type="button">
                Message pièces manquantes
              </button>
              <button className="btn btn-compact" onClick={downloadMvpPdf} type="button">
                <Download size={17} /> PDF unifié
              </button>
              <button className="btn btn-primary btn-compact" onClick={downloadStructuredZip} type="button">
                <FileArchive size={17} /> Télécharger le ZIP
              </button>
            </div>
          </section>
        </div>

        <aside className="pieces-side-card glass">
          <div className="pieces-side-heading">
            <div>
              <p className="eyebrow">Pièces du dossier</p>
              <h2>{presentDocs.length} reçue(s)</h2>
            </div>
            {missingDocs.length ? <span className="badge badge-red">{missingDocs.length} manquante(s)</span> : <span className="badge badge-green">Complet</span>}
          </div>

          <div className="pieces-list-block">
            <h3>Pièces envoyées</h3>
            <div className="document-checklist">
              {presentDocs.map((item) => (
                <article className="doc-check doc-check-ok" key={item.id}>
                  <Check size={18} />
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.personName ? `${item.personName} - ` : ""}{item.category}</small>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {missingDocs.length ? (
            <div className="pieces-list-block">
              <h3>Pièces manquantes</h3>
              <div className="document-checklist">
                {missingDocs.map((item) => (
                  <article className="doc-check doc-check-missing" key={item.id}>
                    <AlertTriangle size={18} />
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.personName ? `${item.personName} - ` : ""}{item.category}</small>
                      {item.evidenceReason ? <small>{item.evidenceReason}</small> : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {modal ? (
        <div className="modal-scrim" role="dialog" aria-modal="true">
          <section className="message-modal glass">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Message prêt à copier</p>
                <h2>{modal.title}</h2>
              </div>
              <button className="icon-btn" onClick={() => setModal(null)} type="button" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            <pre className="message-preview">{modal.text}</pre>
            <div className="dossier-action-row">
              <button className="btn btn-primary" onClick={copyModalText} type="button">
                <Copy size={18} /> {modalCopied ? "Copié" : "Copier le message"}
              </button>
              <button className="btn" onClick={() => setModal(null)} type="button">Fermer</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
