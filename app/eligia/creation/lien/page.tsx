"use client";

import { ArrowRight, Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { buildCandidateLink, saveEligiaDossier } from "@/lib/eligia-mvp";

export default function CandidateLinkPage() {
  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [copied, setCopied] = useState(false);

  function generateLink() {
    const id = `link-${Date.now()}`;
    const link = buildCandidateLink(id);
    saveEligiaDossier({
      id,
      address,
      rent: Number(rent),
      candidates: "Non renseigné",
      status: "Lien candidat envoyé",
      completeness: 5,
      indicator: "En attente du candidat",
      link,
      createdAt: new Date().toISOString(),
      source: "link",
      files: [],
      people: [],
      summary: "En attente du candidat. Le lien a été généré et peut être renvoyé depuis ce dossier."
    });
    setCreatedId(id);
    setGeneratedLink(link);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="page">
      <div className="shell">
        <TopBar backHref="/eligia/creation" smallKasus notifications eligiaProfile />
        <section className="question-flow">
          <div className="question-card glass">
            {!generatedLink ? (
              <>
                <p className="eyebrow">Lien candidat</p>
                <h1>Générer un lien</h1>
                <input className="question-input" onChange={(event) => setAddress(event.target.value)} placeholder="Adresse du bien" value={address} />
                <input className="question-input" inputMode="decimal" onChange={(event) => setRent(event.target.value)} placeholder="Montant du loyer" value={rent} />
                <button className="btn btn-primary" disabled={address.trim().length < 4 || Number(rent) <= 0} onClick={generateLink} type="button">
                  Générer le lien <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <>
                <span className="badge badge-green"><Check size={14} /> Dossier précréé</span>
                <h1>Envoyez ce lien aux candidats</h1>
                <p className="muted">Le lien expire au bout de 10 jours. Il reste réutilisable si plusieurs personnes doivent ajouter leurs pièces.</p>
                <div className="message-preview">{generatedLink}</div>
                <div className="question-actions">
                  <button className="btn btn-primary" onClick={copyLink} type="button">
                    <Copy size={18} /> {copied ? "Lien copié" : "Copier"}
                  </button>
                  <Link className="btn" href={`/eligia/dossiers/${createdId}`}>
                    <ExternalLink size={18} /> Voir le dossier
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
