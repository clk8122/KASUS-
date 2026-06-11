"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotificationsButton } from "./NotificationsButton";
import { ProfileMenu } from "./ProfileMenu";

type TopBarProps = {
  smallKasus?: boolean;
  notifications?: boolean;
  eligiaProfile?: boolean;
  showProfileMenu?: boolean;
};

export function TopBar({ smallKasus, notifications, eligiaProfile, showProfileMenu = true }: TopBarProps) {
  const router = useRouter();

  return (
    <header className="topbar">
      <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
        <button aria-label="Retour" className="icon-btn" onClick={() => router.back()} type="button">
          <ChevronLeft size={20} />
        </button>
        {smallKasus ? (
          <Link aria-label="Retour au menu KASUS" className="topbar-kasus" href="/kasus">
            <span className="brand-wordmark brand-wordmark-small">KASUS</span>
          </Link>
        ) : null}
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
        {notifications ? <NotificationsButton /> : null}
        {showProfileMenu ? <ProfileMenu includeKasusReturn={eligiaProfile} /> : null}
      </div>
    </header>
  );
}
