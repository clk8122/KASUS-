"use client";

import Image from "next/image";
import { Check, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useAccount } from "@/lib/use-account";

type OrganizationDraft = {
  agencyName: string;
  agencyAddress: string;
  legalName: string;
  legalEmail: string;
  signature: string;
};

export function OrganizationClient() {
  const { account, updateAccount, updateLogo } = useAccount();
  // Seules les modifications de l'utilisateur sont stockées : le brouillon
  // est dérivé du compte au rendu, sans synchronisation par effet.
  const [overrides, setOverrides] = useState<Partial<OrganizationDraft>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const draft: OrganizationDraft = {
    agencyName: overrides.agencyName ?? account.agencyName,
    agencyAddress: overrides.agencyAddress ?? account.agencyAddress,
    legalName: overrides.legalName ?? account.legalName,
    legalEmail: overrides.legalEmail ?? account.legalEmail,
    signature: overrides.signature ?? account.signature
  };
  const dirty = Object.keys(overrides).length > 0;

  function edit(updates: Partial<OrganizationDraft>) {
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
      setMessage("Organisation mise à jour.");
    } catch (thrown) {
      setErrorMessage(thrown instanceof Error ? thrown.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setErrorMessage("");
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
        reader.readAsDataURL(file);
      });
      await updateLogo(dataUrl);
      setMessage("Logo mis à jour.");
    } catch (thrown) {
      setErrorMessage(thrown instanceof Error ? thrown.message : "Téléversement du logo impossible.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <section className="profile-page">
      <section className="profile-hero glass reveal">
        <div>
          <p className="page-kicker">Organisation</p>
          <h1>{account.agencyName || "Organisation"}</h1>
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

      <div className="profile-layout reveal reveal-2">
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
        </aside>

        <div className="profile-stack">
          <section className="glass panel profile-panel">
            <div className="panel-heading">
              <div>
                <h2>Identité de l'agence</h2>
                <p>Ces informations apparaissent sur les documents et liens candidats.</p>
              </div>
              <button className="btn btn-primary btn-compact" disabled={saving || !dirty} onClick={() => void save()} type="button">
                {saving ? <Loader2 className="spin" size={16} /> : null}
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
            <div className="split">
              <label className="field">
                Nom de l'agence
                <input className="input" value={draft.agencyName} onChange={(event) => edit({ agencyName: event.target.value })} />
              </label>
              <label className="field">
                Adresse
                <input className="input" value={draft.agencyAddress} onChange={(event) => edit({ agencyAddress: event.target.value })} />
              </label>
              <label className="field">
                Raison sociale
                <input className="input" value={draft.legalName} onChange={(event) => edit({ legalName: event.target.value })} />
              </label>
              <label className="field">
                Email de contact
                <input className="input" type="email" value={draft.legalEmail} onChange={(event) => edit({ legalEmail: event.target.value })} />
              </label>
            </div>
            <label className="field">
              Signature agence
              <textarea className="input textarea" value={draft.signature} onChange={(event) => edit({ signature: event.target.value })} />
            </label>
            {message ? <p className="success-text"><Check size={15} /> {message}</p> : null}
            {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
          </section>

          <section className="glass panel profile-panel">
            <div className="panel-heading">
              <div>
                <h2>Logo</h2>
                <p>PNG ou JPG, affiché sur les supports générés.</p>
              </div>
              {uploading ? <Loader2 className="spin" size={18} /> : null}
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
          </section>
        </div>
      </div>
    </section>
  );
}
