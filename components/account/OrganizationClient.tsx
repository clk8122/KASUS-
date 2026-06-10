"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useAccount } from "@/lib/use-account";

export function OrganizationClient() {
  const { account, updateAccount, updateLogo } = useAccount();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleLogoChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
        reader.readAsDataURL(file);
      });
      await updateLogo(dataUrl);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <section className="profile-page">
      <section className="profile-hero glass">
        <div>
          <p className="eyebrow">Organisation</p>
          <h1>{account.agencyName || "Organisation"}</h1>
          <p className="modules-subtitle">
            Identité de marque, coordonnées et logo photo pour les exports et les écrans métier.
          </p>
        </div>
        <div className="profile-hero-stats">
          <article>
            <span>Nom agence</span>
            <strong>{account.agencyName || "À compléter"}</strong>
          </article>
          <article>
            <span>Raison sociale</span>
            <strong>{account.legalName || "Non renseignée"}</strong>
          </article>
          <article>
            <span>Logo</span>
            <strong>{account.agencyLogo ? "Ajouté" : "En attente"}</strong>
          </article>
        </div>
      </section>

      <div className="profile-layout">
        <aside className="profile-summary glass">
          <div className="profile-avatar">{(account.agencyName.slice(0, 2) || "KA").toUpperCase()}</div>
          <div>
            <h2>{account.agencyName || "Votre agence"}</h2>
            <p>{account.agencyAddress || "Adresse à compléter"}</p>
          </div>
          <div className="profile-mini-metrics">
            <span>
              <strong>{account.firstName || "—"}</strong>
              <small>contact</small>
            </span>
            <span>
              <strong>{account.phone || "—"}</strong>
              <small>téléphone</small>
            </span>
          </div>
          <p className="microcopy">Ces informations peuvent être reprises dans les modules et documents générés.</p>
        </aside>

        <div className="profile-stack">
          <section className="glass panel profile-panel">
            <div className="panel-heading">
              <div>
                <h2>Identité de l'agence</h2>
                <p>Le nom de l'agence modifié ici apparaît aussi sur les écrans principaux.</p>
              </div>
              <span className="microcopy">Sauvegarde automatique</span>
            </div>
            <div className="split">
              <label className="field">
                Nom de l'agence
                <input className="input" value={account.agencyName} onChange={(event) => updateAccount({ agencyName: event.target.value })} />
              </label>
              <label className="field">
                Adresse
                <input className="input" value={account.agencyAddress} onChange={(event) => updateAccount({ agencyAddress: event.target.value })} />
              </label>
              <label className="field">
                Raison sociale
                <input className="input" value={account.legalName} onChange={(event) => updateAccount({ legalName: event.target.value })} />
              </label>
              <label className="field">
                Email de contact
                <input className="input" type="email" value={account.legalEmail} onChange={(event) => updateAccount({ legalEmail: event.target.value })} />
              </label>
            </div>
          </section>

          <section className="glass panel profile-panel">
            <div className="panel-heading">
              <div>
                <h2>Logo et signature</h2>
                <p>Ajoutez une photo de logo et une signature agence pour les futurs exports.</p>
              </div>
            </div>
            <div className="profile-logo-grid">
              <label className="field">
                Photo du logo
                <input
                  accept="image/*"
                  className="input"
                  ref={fileInputRef}
                  type="file"
                  onChange={(event) => void handleLogoChange(event.target.files?.[0] ?? null)}
                />
              </label>
              {account.agencyLogo ? <Image alt="Logo de l'agence" className="logo-preview" height={160} unoptimized width={420} src={account.agencyLogo} /> : null}
            </div>
            <label className="field">
              Signature agence
              <textarea className="input textarea" value={account.signature} onChange={(event) => updateAccount({ signature: event.target.value })} />
            </label>
            {uploading ? <p className="microcopy">Envoi du logo en cours...</p> : null}
          </section>
        </div>
      </div>
    </section>
  );
}
