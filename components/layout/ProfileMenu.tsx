"use client";

import { LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ProfileMenuProps = {
  includeKasusReturn?: boolean;
};

export function ProfileMenu({ includeKasusReturn }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-label="Ouvrir le menu profil"
        className="icon-btn"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <UserRound size={19} />
      </button>
      {open ? (
        <div className="menu" role="menu">
          <Link href="/profil" role="menuitem">
            <UserRound size={16} /> Mon profil
          </Link>
          <Link href="/organisation" role="menuitem">
            <Settings size={16} /> Reglages
          </Link>
          <Link href="/rgpd" role="menuitem">
            <ShieldCheck size={16} /> RGPD
          </Link>
          {includeKasusReturn ? <Link href="/kasus">Retour au menu KASUS</Link> : null}
          <Link href="/" role="menuitem">
            <LogOut size={16} /> Deconnexion
          </Link>
        </div>
      ) : null}
    </div>
  );
}
