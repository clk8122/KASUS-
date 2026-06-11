"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "@/lib/use-account";

export function ProfileClient() {
  const { account, updateAccount } = useAccount();
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    await updateAccount({
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      phone: account.phone,
      agencyName: account.agencyName,
      agencyAddress: account.agencyAddress,
      legalName: account.legalName,
      legalEmail: account.legalEmail,
      signature: account.signature
    });
    setMessage("Profil mis à jour.");
  }

  return (
    <section className="profile-page">
      <section className="profile-hero glass">
        <div>
          <h1>Mon profil</h1>
        </div>
        <div className="profile-hero-stats">
          <article>
            <span>Nom affiché</span>
            <strong>{[account.firstName, account.lastName].filter(Boolean).join(" ") || account.email || "Compte"}</strong>
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

      <div className="profile-layout">
        <aside className="profile-summary glass">
          <div className="profile-avatar">
            {(account.firstName || account.email || "K").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{[account.firstName, account.lastName].filter(Boolean).join(" ") || account.email || "Compte"}</h2>
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
                <p>Modifiez votre identité et les coordonnées de l’organisation.</p>
              </div>
              <button className="btn btn-primary btn-compact" onClick={save} type="button">Enregistrer</button>
            </div>
            <div className="split">
              <label className="field">
                Prénom
                <input className="input" value={account.firstName} onChange={(event) => updateAccount({ firstName: event.target.value })} />
              </label>
              <label className="field">
                Nom
                <input className="input" value={account.lastName} onChange={(event) => updateAccount({ lastName: event.target.value })} />
              </label>
              <label className="field">
                Email
                <input className="input" type="email" value={account.email} onChange={(event) => updateAccount({ email: event.target.value })} />
              </label>
              <label className="field">
                Téléphone
                <input className="input" value={account.phone} onChange={(event) => updateAccount({ phone: event.target.value })} />
              </label>
            </div>
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

          {message ? <p className="success-text">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}
