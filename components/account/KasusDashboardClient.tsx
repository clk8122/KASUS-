"use client";

import Link from "next/link";
import { ArrowUpRight, FileCheck2, PenLine } from "lucide-react";
import { useAccount } from "@/lib/use-account";

export function KasusDashboardClient() {
  const { account } = useAccount();

  return (
    <section className="modules-page">
      <div className="modules-heading">
        <p className="eyebrow">Espace de travail</p>
        <h1>{account.agencyName}</h1>
        <p className="modules-subtitle">Choisissez votre module</p>
      </div>
      <div className="module-grid module-grid-pro">
        <Link className="module-card-pro module-card-active" href="/eligia">
          <span className="module-icon">
            <FileCheck2 size={24} />
          </span>
          <span className="module-status module-status-live">Ouvert</span>
          <div>
            <h2>ELIGIA</h2>
            <p>Gestion des dossiers locatifs, suivi candidat et controles documentaires.</p>
          </div>
          <span className="module-open">
            Ouvrir <ArrowUpRight size={17} />
          </span>
        </Link>
        <Link className="module-card-pro" href="/studio" aria-label="Ouvrir STUDIO, en cours de creation">
          <span className="module-icon">
            <PenLine size={24} />
          </span>
          <span className="module-status">À activer</span>
          <div>
            <h2>STUDIO</h2>
            <p>Creation d'annonces immobilieres professionnelles pretes a publier.</p>
          </div>
          <span className="module-open">
            Voir <ArrowUpRight size={17} />
          </span>
        </Link>
      </div>
    </section>
  );
}
