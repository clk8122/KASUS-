"use client";

import { Bell } from "lucide-react";
import { useDismissable } from "@/lib/use-dismissable";

export function NotificationsButton() {
  const { containerRef, open, setOpen } = useDismissable<HTMLDivElement>();

  return (
    <div className="relative" ref={containerRef}>
      <button aria-expanded={open} aria-label="Notifications dossiers" className="icon-btn" onClick={() => setOpen((value) => !value)} type="button">
        <Bell size={18} />
      </button>
      {open ? (
        <div className="menu notification-menu" role="status">
          <strong>Notifications</strong>
          <p>Vos dossiers actifs et vos documents récents apparaissent ici après connexion.</p>
          <p>Ajoutez des dossiers réels dans ELIGIA pour afficher des notifications utiles.</p>
        </div>
      ) : null}
    </div>
  );
}
