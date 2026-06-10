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
          <p>Un justificatif de domicile du garant reste a verifier.</p>
          <p>Le dossier Camille Martin est pret pour lecture finale.</p>
        </div>
      ) : null}
    </div>
  );
}
