"use client";

import { LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { useDismissable } from "@/lib/use-dismissable";

type ProfileMenuProps = {
  includeKasusReturn?: boolean;
};

export function ProfileMenu({ includeKasusReturn }: ProfileMenuProps) {
  const { containerRef, open, setOpen } = useDismissable<HTMLDivElement>();
  const router = useRouter();

  function close() {
    setOpen(false);
  }

  async function signOut() {
    close();
    await getSupabaseBrowser()?.auth.signOut();
    router.push("/");
  }

  return (
    <div className="relative" ref={containerRef}>
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
          <Link href="/profil" onClick={close} role="menuitem">
            <UserRound size={16} /> Mon profil
          </Link>
          <Link href="/organisation" onClick={close} role="menuitem">
            <Settings size={16} /> Réglages
          </Link>
          <Link href="/rgpd" onClick={close} role="menuitem">
            <ShieldCheck size={16} /> RGPD
          </Link>
          {includeKasusReturn ? (
            <Link href="/kasus" onClick={close} role="menuitem">
              Retour au menu KASUS
            </Link>
          ) : null}
          <button onClick={() => void signOut()} role="menuitem" type="button">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      ) : null}
    </div>
  );
}
