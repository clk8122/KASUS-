"use client";

import Image from "next/image";
import { useAccount } from "@/lib/use-account";
import { useRef, useState } from "react";

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
      <div className="profile-heading">
        <p className="eyebrow">Organisation</p>
        <h1>{account.agencyName}</h1>
      </div>
      <div className="profile-layout">
        <aside className="profile-summary glass">
          <div className="profile-avatar">{account.agencyName.slice(0, 2).toUpperCase()}</div>
          <div>
            <h2>{account.agencyName}</h2>
            <p>{account.agencyAddress}</p>
          </div>
          <p className="microcopy">Ces informations peuvent etre reprises dans les modules et documents generes.</p>
        </aside>
        <div className="profile-stack">
          <section className="glass panel profile-panel">
            <div className="panel-heading">
              <div>
                <h2>Identite de l'agence</h2>
                <p>Le nom de l'agence modifie ici apparait aussi en grand titre sur le choix des modules.</p>
              </div>
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
