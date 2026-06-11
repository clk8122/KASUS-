"use client";

import { ArrowRight, Check, Copy, Link2 } from "lucide-react";
import { useState } from "react";
import { buildCandidateLink, saveEligiaDossier } from "@/lib/eligia-mvp";

export function CandidateLinkGenerator() {
  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("");
  const [candidateLink, setCandidateLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function createLink() {
    const id = `created-${Date.now()}`;
    const link = buildCandidateLink(id);
    saveEligiaDossier({
      id,
      address: address.trim(),
      rent: Number(rent),
      candidates: "Candidat",
      status: "Lien candidat envoyé",
      completeness: 0,
      indicator: "Lien prêt",
      link,
      createdAt: new Date().toISOString(),
      source: "link",
      files: [],
      people: [],
      summary: "Lien candidat prêt à être transmis.",
      report: undefined
    });
    setCandidateLink(link);
    setMessage("Le lien est prêt. Copiez-le et envoyez-le au candidat.");
  }

  return (
    <section className="question-flow">
      <div className="builder-heading">
        <p className="eyebrow">ELIGIA</p>
        <h1>Générer un lien candidat</h1>
        <p>Renseignez l’adresse et le loyer. Le lien ouvre le portail candidat prêt à compléter.</p>
      </div>

      <div className="glass panel builder-panel">
        <div className="split">
          <label className="field">
            Adresse du bien
            <input className="input" placeholder="12 rue du Parc, 54000 Nancy" value={address} onChange={(event) => setAddress(event.target.value)} />
          </label>
          <label className="field">
            Loyer charges comprises
            <input className="input" inputMode="decimal" placeholder="780" value={rent} onChange={(event) => setRent(event.target.value)} />
          </label>
        </div>

        <div className="builder-actions">
          <button className="btn btn-primary" disabled={address.trim().length < 4 || Number(rent) <= 0} onClick={createLink} type="button">
            Créer le lien <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {candidateLink ? (
        <section className="glass panel candidate-link-card">
          <div className="candidate-link-head">
            <div>
              <p className="eyebrow">Lien candidat</p>
              <h2>À transmettre au locataire</h2>
              <p>Ce lien ouvre le parcours candidat pour compléter le dossier.</p>
            </div>
            <span className="badge badge-green">Prêt</span>
          </div>

          <div className="candidate-link-box">
            <Link2 size={18} />
            <code>{candidateLink}</code>
          </div>

          <div className="builder-actions">
            <button className="btn btn-primary" onClick={() => void copyLink(candidateLink)} type="button">
              <Copy size={17} /> {copied ? "Lien copié" : "Copier le lien"}
            </button>
            <a className="btn" href={candidateLink} target="_blank" rel="noreferrer">
              Ouvrir le portail
            </a>
          </div>

          {message ? <p className="notice">{message}</p> : null}
        </section>
      ) : null}
    </section>
  );
}
