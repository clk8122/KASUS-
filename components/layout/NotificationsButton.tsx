"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

export function NotificationsButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button aria-expanded={open} aria-label="Notifications dossiers" className="icon-btn" onClick={() => setOpen((value) => !value)} type="button">
        <Bell size={18} />
      </button>
      {open ? (
        <div className="menu notification-menu" role="status">
          <strong>Notifications</strong>
          <p>Vos dossiers actifs et vos documents recentes apparaissent ici apres connexion.</p>
          <p>Ajoutez des dossiers réels dans ELIGIA pour afficher des notifications utiles.</p>
        </div>
      ) : null}
    </div>
  );
}
