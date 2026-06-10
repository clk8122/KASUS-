"use client";

import { ArrowRight, Check, Crown, LockKeyhole, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useAccount } from "@/lib/use-account";

type ModuleKey = "eligia" | "studio";

type ModuleCard = {
  key: ModuleKey;
  title: string;
  tagline: string;
  description: string;
  points: string[];
};

const modules: ModuleCard[] = [
  {
    key: "eligia",
    title: "ELIGIA",
    tagline: "Gestion locative",
    description: "Dossiers, portail candidat et analyse documentaire avec une interface opérationnelle.",
    points: ["Analyse des pièces", "Suivi des candidatures", "Relances et exports"]
  },
  {
    key: "studio",
    title: "STUDIO",
    tagline: "Création immobilière",
    description: "Annonces, visuels et contenus de présentation avec une direction artistique nette.",
    points: ["Mises en page premium", "Contenus prêts à publier", "Création guidée"]
  }
];

export function SubscriptionClient() {
  const { activeModules, account, hasSubscription, signOut, startCheckout } = useAccount();
  const [message, setMessage] = useState("");
  const [loadingModule, setLoadingModule] = useState<ModuleKey | "">("");
  const activeCount = useMemo(() => activeModules.length, [activeModules]);

  async function buy(moduleKey: ModuleKey) {
    setLoadingModule(moduleKey);
    setMessage("");
    const payload = await startCheckout(moduleKey);
    if (payload?.error) {
      setMessage(payload.error);
    }
    setLoadingModule("");
  }

  return (
    <section className="subscription-shell">
      <div className="subscription-hero glass">
        <div>
          <p className="eyebrow">Abonnement</p>
          <h1>Modules activables à la carte</h1>
          <p className="modules-subtitle">
            Chaque module coûte 99 EUR / mois. Sans abonnement, aucun espace produit n’est accessible.
          </p>
        </div>
        <div className="subscription-metrics">
          <article>
            <span>Compte</span>
            <strong>{account.email || "Connecté"}</strong>
          </article>
          <article>
            <span>Modules actifs</span>
            <strong>{activeCount}</strong>
          </article>
          <article>
            <span>Statut</span>
            <strong>{hasSubscription ? "Actif" : "Verrouillé"}</strong>
          </article>
        </div>
      </div>

      <div className="billing-grid billing-grid-modules subscription-grid">
        {modules.map((module) => {
          const active = activeModules.includes(module.key);
          return (
            <button className={`subscription-card glass ${active ? "subscription-card-active" : ""}`} key={module.key} onClick={() => void buy(module.key)} type="button">
              <div className="subscription-card-top">
                <span className="subscription-chip">{module.tagline}</span>
                {active ? <span className="badge badge-green">Actif</span> : <span className="badge">Verrouillé</span>}
              </div>
              <div className="subscription-card-title">
                <h2>{module.title}</h2>
                <strong>99 EUR</strong>
              </div>
              <p>{module.description}</p>
              <div className="subscription-points">
                {module.points.map((point) => (
                  <span key={point}><Check size={14} /> {point}</span>
                ))}
              </div>
              <div className="subscription-card-bottom">
                <span>
                  <LockKeyhole size={15} />
                  {active ? "Déjà activé" : "Cliquer pour débloquer"}
                </span>
                <span className="subscription-action">
                  {loadingModule === module.key ? "Ouverture..." : `Souscrire`}
                  <ArrowRight size={16} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <section className="subscription-footer glass">
        <div>
          <p className="eyebrow">Compte</p>
          <h2>{account.agencyName || "Votre agence"}</h2>
          <p className="muted">Le site reste verrouillé tant qu’aucun module n’est actif.</p>
        </div>
        <div className="subscription-footer-actions">
          <button className="btn btn-compact" onClick={() => void signOut()} type="button">
            Déconnexion
          </button>
          <span className="subscription-footer-note">
            <Crown size={15} /> Accès modulaire par abonnement
          </span>
        </div>
      </section>

      {message ? <p className="notice">{message}</p> : null}
    </section>
  );
}
