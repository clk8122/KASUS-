"use client";

import { useState } from "react";
import { useAccount } from "@/lib/use-account";

const modules = [
  {
    key: "eligia" as const,
    title: "ELIGIA",
    description: "Gestion locative, dossiers candidats et analyse documentaire.",
    price: 99
  },
  {
    key: "studio" as const,
    title: "STUDIO",
    description: "Création d'annonces immobilières et contenus professionnels.",
    price: 99
  }
];

export function SubscriptionClient() {
  const { activeModules, account, hasSubscription, signOut, startCheckout } = useAccount();
  const [message, setMessage] = useState("");
  const [loadingModule, setLoadingModule] = useState<"eligia" | "studio" | "">("");

  async function buy(moduleKey: "eligia" | "studio") {
    setLoadingModule(moduleKey);
    setMessage("");
    const payload = await startCheckout(moduleKey);
    if (payload?.error) {
      setMessage(payload.error);
    }
    setLoadingModule("");
  }

  return (
    <section className="profile-page">
      <div className="profile-heading">
        <p className="eyebrow">Abonnement</p>
        <h1>Modules et accès</h1>
        <p className="modules-subtitle">Chaque module est facturé 99 EUR / mois. Sans module actif, aucun espace produit n'est accessible.</p>
      </div>

      <div className="billing-grid billing-grid-modules">
        {modules.map((module) => {
          const active = activeModules.includes(module.key);
          return (
            <section className="glass panel profile-panel billing-hero" key={module.key}>
              <h2>{module.title}</h2>
              <strong>{module.price} EUR</strong>
              <p>{module.description}</p>
              <p className={active ? "success-text" : "muted"}>{active ? "Actif" : "Non souscrit"}</p>
              {!active ? (
                <button className="btn btn-primary btn-compact" disabled={loadingModule === module.key} onClick={() => buy(module.key)} type="button">
                  {loadingModule === module.key ? "Ouverture..." : `Souscrire à ${module.title}`}
                </button>
              ) : null}
            </section>
          );
        })}
      </div>

      <section className="glass panel profile-panel">
        <div className="panel-heading">
          <div>
            <h2>Compte</h2>
            <p>{account.email || "Compte connecté"}</p>
          </div>
          <button className="btn btn-compact" onClick={() => signOut()} type="button">Déconnexion</button>
        </div>
        {message ? <p className="notice">{message}</p> : null}
        <p className="muted">
          {hasSubscription ? "Au moins un module est actif." : "Vous devez souscrire à au moins un module pour accéder au site."}
        </p>
      </section>
    </section>
  );
}
