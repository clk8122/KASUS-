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
    ["Supabase", status?.supabase, "Auth, base de donnees et profils"],
    ["Storage", status?.storage, "Stockage prive des pieces"],
    ["Stripe", status?.stripe, "Paiement des seats supplementaires"]
  ] as const;

  return (
    <section className="profile-page">
      <div className="profile-heading">
        <p className="eyebrow">Systeme</p>
        <h1>Configuration</h1>
      </div>
      <div className="profile-secondary-grid">
        {items.map(([label, ready, description]) => (
          <div className="glass panel profile-panel" key={label}>
            <span className={`badge ${ready ? "badge-green" : "badge-red"}`}>{ready ? "Configure" : "A configurer"}</span>
            <h2>{label}</h2>
            <p className="muted">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
