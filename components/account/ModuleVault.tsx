"use client";

import { ArrowRight, Check, FileCheck2, LockKeyhole, PenLine, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAccount } from "@/lib/use-account";

type ModuleKey = "eligia" | "studio";

type ModuleInfo = {
  key: ModuleKey;
  title: string;
  eyebrow: string;
  description: string;
  points: string[];
  badge: string;
  accent: "graphite" | "green";
};

const modules: ModuleInfo[] = [
  {
    key: "eligia",
    title: "ELIGIA",
    eyebrow: "Gestion locative",
    description: "Dossiers candidats, analyse documentaire, messages de relance et suivi d'équipe dans une seule interface.",
    points: [
      "Création de dossiers et portail candidat",
      "Analyse de pièces et synthèse automatique",
      "Suivi des dossiers Supabase en temps réel"
    ],
    badge: "99 EUR / mois",
    accent: "green"
  },
  {
    key: "studio",
    title: "STUDIO",
    eyebrow: "Création immobilière",
    description: "Concevez des supports élégants et des annonces prêtes à publier pour présenter vos biens avec une vraie direction artistique.",
    points: [
      "Pages de création et templates",
      "Exports propres pour diffusion",
      "Contenus optimisés pour vos annonces"
    ],
    badge: "99 EUR / mois",
    accent: "graphite"
  }
];

type ModuleVaultProps = {
  mode?: "landing" | "locked";
};

export function ModuleVault({ mode = "landing" }: ModuleVaultProps) {
  const { activeModules, startCheckout, signOut, account } = useAccount();
  const [selected, setSelected] = useState<ModuleKey | "">("");
  const [pending, setPending] = useState<ModuleKey | "">("");
  const currentModule = useMemo(() => modules.find((item) => item.key === selected) ?? null, [selected]);
  const selectedIsActive = currentModule ? activeModules.includes(currentModule.key) : false;

  async function subscribe(moduleKey: ModuleKey) {
    setPending(moduleKey);
    const payload = await startCheckout(moduleKey);
    if (payload?.error) {
      setPending("");
    }
  }

  return (
    <section className="vault-shell">
      <div className="vault-hero glass">
        <div className="vault-hero-copy">
          <p className="eyebrow">KASUS</p>
          <h1>Un espace modulaire, propre et verrouillé par abonnement.</h1>
          <p>
            {account.agencyName || "Votre agence"} accède à un environnement premium où chaque module s’active séparément.
          </p>
        </div>
        <div className="vault-hero-metrics">
          <div>
            <span>Modules</span>
            <strong>{activeModules.length || "0"}</strong>
          </div>
          <div>
            <span>Abonnement</span>
            <strong>{activeModules.length ? "Actif" : "Verrouillé"}</strong>
          </div>
          <div>
            <span>Connexion</span>
            <strong>{mode === "locked" ? "Requise" : "En cours"}</strong>
          </div>
        </div>
      </div>

      <div className="module-grid module-grid-pro vault-grid">
        {modules.map((module) => {
          const active = activeModules.includes(module.key);
          return (
            <button
              className={`module-card-pro vault-card ${active ? "module-card-active" : ""}`}
              key={module.key}
              onClick={() => setSelected(module.key)}
              type="button"
            >
              <span className="module-float-icon">
                {module.key === "eligia" ? <FileCheck2 size={24} /> : <PenLine size={24} />}
              </span>
              <span className="module-badge">{module.badge}</span>
              <div className="module-lock">
                <LockKeyhole size={18} />
                <span>{active ? "Déverrouillé" : "Verrouillé"}</span>
              </div>
              <div>
                <p className="module-eyebrow">{module.eyebrow}</p>
                <h2>{module.title}</h2>
                <p>{module.description}</p>
              </div>
              <span className="module-open">
                {active ? "Ouvrir" : "Voir le module"} <ArrowRight size={17} />
              </span>
            </button>
          );
        })}
      </div>

      {currentModule ? (
        <div className="vault-modal-scrim" role="dialog" aria-modal="true">
          <section className={`vault-modal glass vault-modal-${currentModule.accent}`}>
            <button aria-label="Fermer" className="vault-close" onClick={() => setSelected("")} type="button">
              <X size={18} />
            </button>
            <div className="vault-modal-header">
              <div>
                <p className="eyebrow">{currentModule.eyebrow}</p>
                <h2>{currentModule.title}</h2>
              </div>
              <span className="badge badge-green">{currentModule.badge}</span>
            </div>
            <p className="vault-modal-copy">{currentModule.description}</p>
            <div className="vault-points">
              {currentModule.points.map((point) => (
                <div key={point}>
                  <Check size={16} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
            {selectedIsActive ? (
              <div className="vault-modal-actions">
                <button className="btn btn-primary" onClick={() => setSelected("")} type="button">
                  Ouvrir le module
                </button>
              </div>
            ) : (
              <>
                <div className="vault-modal-actions">
                  <button
                    className="btn btn-primary"
                    disabled={pending === currentModule.key}
                    onClick={() => void subscribe(currentModule.key)}
                    type="button"
                  >
                    {pending === currentModule.key ? "Ouverture..." : `Souscrire à ${currentModule.title}`}
                  </button>
                  <button className="btn" onClick={() => setSelected("")} type="button">
                    Continuer sans ouvrir
                  </button>
                </div>
                <div className="vault-note">
                  <Sparkles size={16} />
                  <span>Chaque module est facturé séparément, à 99 EUR / mois.</span>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}

      {mode === "locked" ? (
        <div className="vault-footer">
          <button className="btn btn-compact" onClick={() => void signOut()} type="button">
            Déconnexion
          </button>
        </div>
      ) : null}
    </section>
  );
}
