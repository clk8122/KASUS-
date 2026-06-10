import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { NotificationsButton } from "./NotificationsButton";
import { ProfileMenu } from "./ProfileMenu";

type TopBarProps = {
  smallKasus?: boolean;
  backHref?: string;
  notifications?: boolean;
  eligiaProfile?: boolean;
};

export function TopBar({ backHref, smallKasus, notifications, eligiaProfile }: TopBarProps) {
  return (
    <header className="topbar">
      <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
        {backHref ? (
          <Link aria-label="Retour" className="icon-btn" href={backHref}>
            <ChevronLeft size={20} />
          </Link>
        ) : null}
        {smallKasus ? (
          <Link aria-label="Retour au menu KASUS" className="topbar-kasus" href="/kasus">
            <span className="brand-wordmark brand-wordmark-small">KASUS</span>
          </Link>
        ) : null}
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
        {notifications ? <NotificationsButton /> : null}
        <ProfileMenu includeKasusReturn={eligiaProfile} />
      </div>
    </header>
  );
}
