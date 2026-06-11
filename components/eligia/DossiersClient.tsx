"use client";

import Link from "next/link";
import { FolderOpen, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@/lib/use-account";
import { deleteEligiaDossier, readEligiaDossiers, type EligiaMvpDossier } from "@/lib/eligia-mvp";

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

type UnifiedDossier = {
  id: string;
  address: string;
  rent: number;
  status: string;
  completeness: number;
  indicator: string;
  summary: string;
  createdAt: string;
  origin: "serveur" | "appareil";
};

function fromRemote(row: DossierRow): UnifiedDossier {
  return {
    id: row.id,
    address: row.address,
    rent: Number(row.rent),
    status: row.status,
    completeness: row.completeness,
    indicator: row.solvency_label ?? "Analyse en attente",
    summary: row.summary,
    createdAt: row.created_at,
    origin: "serveur"
  };
}

function fromLocal(dossier: EligiaMvpDossier): UnifiedDossier {
  return {
    id: dossier.id,
    address: dossier.address,
    rent: dossier.rent,
    status: dossier.status,
    completeness: dossier.completeness,
    indicator: dossier.indicator,
    summary: dossier.summary,
    createdAt: dossier.createdAt,
    origin: "appareil"
  };
}

export function DossiersClient() {
  const { sessionToken, loading, authenticated, activeModules } = useAccount();
  const [remoteDossiers, setRemoteDossiers] = useState<UnifiedDossier[]>([]);
  const [localDossiers, setLocalDossiers] = useState<UnifiedDossier[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  const loadLocalDossiers = useCallback(() => {
    setLocalDossiers(readEligiaDossiers().map(fromLocal));
  }, []);

  const loadDossiers = useCallback(async () => {
    loadLocalDossiers();
    if (!sessionToken) {
      setBusy(false);
      return;
    }
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
      setRemoteDossiers((payload.dossiers ?? []).map(fromRemote));
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Chargement impossible.");
    } finally {
      setBusy(false);
    }
  }, [loadLocalDossiers, sessionToken]);

  useEffect(() => {
    if (!loading && authenticated && activeModules.includes("eligia")) {
      queueMicrotask(() => {
        void loadDossiers();
      });
    }
  }, [activeModules, authenticated, loadDossiers, loading]);

  function removeLocal(id: string) {
    deleteEligiaDossier(id);
    loadLocalDossiers();
  }

  const dossiers = [...localDossiers, ...remoteDossiers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <section className="dossiers-page">
      <div className="dossiers-heading reveal">
        <div>
          <p className="page-kicker">ELIGIA</p>
          <h1>Mes dossiers</h1>
        </div>
        <div className="dossier-actions">
          <button className="icon-btn" onClick={() => void loadDossiers()} type="button" aria-label="Rafraîchir">
            <RefreshCw className={busy ? "spin" : undefined} size={18} />
          </button>
          <Link aria-label="Créer un dossier" className="icon-btn" href="/eligia/creation">
            <Plus size={19} />
          </Link>
        </div>
      </div>

      {error ? <p className="notice reveal">{error}</p> : null}

      {busy && !dossiers.length ? (
        <div className="dossiers-grid" aria-busy="true" aria-label="Chargement des dossiers">
          {[0, 1, 2, 3].map((index) => (
            <div className="glass dossier-card skeleton-card" key={index}>
              <span className="skeleton skeleton-badge" />
              <span className="skeleton skeleton-title" />
              <span className="skeleton skeleton-line" />
              <span className="skeleton skeleton-line skeleton-line-short" />
            </div>
          ))}
        </div>
      ) : dossiers.length ? (
        <div className="dossiers-grid">
          {dossiers.map((dossier, index) => (
            <article className={`glass dossier-card reveal reveal-${Math.min(index + 1, 6)}`} key={dossier.id}>
              <div className="panel-heading">
                <div>
                  <span className="badge">{dossier.status}</span>
                  {dossier.origin === "appareil" ? <span className="badge badge-device">Sur cet appareil</span> : null}
                  <h2>{dossier.address || "Adresse à renseigner"}</h2>
                </div>
                <span className="badge badge-green">{dossier.completeness}%</span>
              </div>
              <p className="muted">{dossier.summary}</p>
              <div className="dossier-meta">
                <span>{Math.round(dossier.rent)} EUR / mois</span>
                <span>{dossier.indicator}</span>
              </div>
              <div className="dossier-actions">
                <Link className="btn btn-primary btn-compact" href={`/eligia/dossiers/${dossier.id}`}>
                  Ouvrir le dossier
                </Link>
                {dossier.origin === "appareil" ? (
                  <button
                    aria-label="Supprimer ce dossier local"
                    className="icon-btn delete-dossier-btn"
                    onClick={() => removeLocal(dossier.id)}
                    type="button"
                  >
                    <Trash2 size={17} />
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state glass reveal">
          <span className="empty-state-icon">
            <FolderOpen size={26} />
          </span>
          <h2>Aucun dossier pour le moment</h2>
          <p>Créez un dossier depuis l’agence ou envoyez un lien candidat pour démarrer.</p>
          <Link className="btn btn-primary" href="/eligia/creation">Créer un dossier</Link>
        </div>
      )}
    </section>
  );
}
