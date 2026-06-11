"use client";

import { useEffect, useState } from "react";

type Status = {
  openai: boolean;
  supabase: boolean;
  stripe: boolean;
  storage: boolean;
};

export function SystemStatusClient() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/system/status")
      .then((response) => response.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const items = [
    ["OpenAI", status?.openai, "Analyse IA des dossiers"],
    ["Base de données", status?.supabase, "Auth, données et profils"],
    ["Fichiers", status?.storage, "Stockage privé des pièces"],
    ["Stripe", status?.stripe, "Paiement des seats supplementaires"]
  ] as const;

  return (
    <section className="profile-page">
      <div className="profile-heading reveal">
        <p className="page-kicker">Système</p>
        <h1>Configuration</h1>
      </div>
      <div className="profile-secondary-grid">
        {items.map(([label, ready, description], index) => (
          <div className={`glass panel profile-panel reveal reveal-${Math.min(index + 1, 6)}`} key={label}>
            {status === null ? (
              <span className="skeleton skeleton-badge" />
            ) : (
              <span className={`badge ${ready ? "badge-green" : "badge-red"}`}>{ready ? "Configuré" : "À configurer"}</span>
            )}
            <h2>{label}</h2>
            <p className="muted">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
