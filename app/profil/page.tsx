import { AccessGate } from "@/components/auth/AccessGate";
import { ProfileClient } from "@/components/account/ProfileClient";
import { TopBar } from "@/components/layout/TopBar";

export default function ProfilPage() {
  return (
    <AccessGate requiredModule="any" title="KASUS" subtitle="Gérez votre profil réel.">
      <main className="page">
        <div className="shell">
          <TopBar backHref="/kasus" />
          <ProfileClient />
        </div>
      </main>
    </AccessGate>
  );
}
