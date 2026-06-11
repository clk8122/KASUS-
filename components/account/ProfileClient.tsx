"use client";

import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAccount } from "@/lib/use-account";

type ProfileDraft = {
  firstName: string;
  lastName: string;
  phone: string;
};

export function ProfileClient() {
  const { account, updateAccount } = useAccount();
  // Seules les modifications de l'utilisateur sont stockées : le brouillon
  // est dérivé du compte au rendu, sans synchronisation par effet.
  const [overrides, setOverrides] = useState<Partial<ProfileDraft>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const draft: ProfileDraft = {
    firstName: overrides.firstName ?? account.firstName,
    lastName: overrides.lastName ?? account.lastName,
    phone: overrides.phone ?? account.phone
  };
  const dirty = Object.keys(overrides).length > 0;

  function edit(updates: Partial<ProfileDraft>) {
    setMessage("");
    setErrorMessage("");
    setOverrides((current) => ({ ...current, ...updates }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    setErrorMessage("");
    try {
      await updateAccount(draft);
      setOverrides({});
      setMessage("Profil mis à jour.");
    } catch (thrown) {
      setErrorMessage(thrown instanceof Error ? thrown.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  const displayName = [account.firstName, account.lastName].filter(Boolean).join(" ") || account.email || "Compte";

  return (
    <section className="profile-page">
      <section className="profile-hero glass reveal">
        <div>
          <p className="page-kicker">Compte</p>
          <h1>Mon profil</h1>
        </div>
        <div className="profile-hero-stats">
          <article>
            <span>Nom affiché</span>
            <strong>{displayName}</strong>
          </article>
          <article>
            <span>Abonnement</span>
            <strong>{account.planName}</strong>
          </article>
          <article>
            <span>Équipe</span>
            <strong>{account.team.length} membre(s)</strong>
          </article>
        </div>
      </section>

      <div className="profile-layout reveal reveal-2">
        <aside className="profile-summary glass">
          <div className="profile-avatar">
            {(account.firstName || account.email || "K").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{displayName}</h2>
            <p>{account.planName}</p>
          </div>
          <div className="profile-mini-metrics">
            <span>
              <strong>{account.includedSeats}</strong>
              <small>places incluses</small>
            </span>
            <span>
              <strong>{account.extraSeatPrice} EUR</strong>
              <small>siège additionnel</small>
            </span>
          </div>
        </aside>

        <div className="profile-stack">
          <section className="glass panel profile-panel">
            <div className="panel-heading">
              <div>
                <h2>Informations personnelles</h2>
                <p>Votre identité et le numéro utilisé pour vous joindre.</p>
              </div>
              <button className="btn btn-primary btn-compact" disabled={saving || !dirty} onClick={() => void save()} type="button">
                {saving ? <Loader2 className="spin" size={16} /> : null}
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
            <div className="split">
              <label className="field">
                Prénom
                <input className="input" value={draft.firstName} onChange={(event) => edit({ firstName: event.target.value })} />
              </label>
              <label className="field">
                Nom
                <input className="input" value={draft.lastName} onChange={(event) => edit({ lastName: event.target.value })} />
              </label>
              <label className="field">
                Email
                <input className="input" disabled readOnly type="email" value={account.email} />
              </label>
              <label className="field">
                Téléphone
                <input className="input" value={draft.phone} onChange={(event) => edit({ phone: event.target.value })} />
              </label>
            </div>
            {message ? <p className="success-text"><Check size={15} /> {message}</p> : null}
            {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
          </section>

          <section className="profile-secondary-grid">
            <div className="glass panel profile-panel">
              <h2>Abonnement</h2>
              <Link className="btn btn-compact" href="/abonnement">Ouvrir la facturation</Link>
            </div>
            <div className="glass panel profile-panel">
              <h2>Organisation</h2>
              <Link className="btn btn-compact" href="/organisation">Configurer</Link>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
