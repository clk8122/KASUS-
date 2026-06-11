"use client";

import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@/lib/use-account";

type DossierRow = {
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

export function DossiersClient() {
  const { sessionToken, loading, authenticated, activeModules } = useAccount();
  const [dossiers, setDossiers] = useState<DossierRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadDossiers = useCallback(async () => {
    if (!sessionToken) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/eligia/dossiers", {
        headers: {
          Authorization: `Bearer ${sessionToken}`
        }
      });
      const payload = (await response.json()) as { dossiers?: DossierRow[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Chargement impossible.");
      }
      setDossiers(payload.dossiers ?? []);
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Chargement impossible.");
    } finally {
      setBusy(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (!loading && authenticated && activeModules.includes("eligia")) {
      queueMicrotask(() => {
        void loadDossiers();
      });
    }
  }, [activeModules, authenticated, loadDossiers, loading]);

  if (busy) {
    return (
      <section className="empty-state glass">
        <p>Chargement des dossiers réels...</p>
      </section>
    );
  }

  return (
    <section className="dossiers-page">
      <div className="dossiers-heading">
        <div>
          <p className="eyebrow">ELIGIA</p>
          <h1>Mes dossiers</h1>
          <p className="muted">Les dossiers enregistrés apparaissent ici.</p>
        </div>
        <div className="dossier-actions">
          <button className="icon-btn" onClick={() => void loadDossiers()} type="button" aria-label="Rafraîchir">
            <RefreshCw size={18} />
          </button>
          <Link aria-label="Créer un dossier" className="icon-btn" href="/eligia/creation">
            <Plus size={19} />
          </Link>
        </div>
      </div>

      {error ? <p className="notice">{error}</p> : null}

      {dossiers.length ? (
        <div className="dossiers-grid">
          {dossiers.map((dossier) => (
            <article className="glass dossier-card" key={dossier.id}>
              <div className="panel-heading">
                <div>
                  <span className="badge">{dossier.status}</span>
                  <h2>{dossier.address}</h2>
                </div>
                <span className="badge badge-green">{dossier.completeness}%</span>
              </div>
              <p className="muted">{dossier.summary}</p>
              <div className="dossier-meta">
                <span>{Math.round(Number(dossier.rent))} EUR / mois</span>
                <span>{dossier.solvency_label ?? "Analyse en attente"}</span>
              </div>
              <Link className="btn btn-primary btn-compact" href={`/eligia/dossiers/${dossier.id}`}>
                Ouvrir le dossier
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state glass">
          <h2>Aucun dossier enregistré</h2>
          <p>Créez un dossier depuis l’agence ou envoyez un lien candidat pour démarrer un nouveau dossier.</p>
          <Link className="btn btn-primary" href="/eligia/creation">Créer un dossier</Link>
        </div>
      )}
    </section>
  );
}
