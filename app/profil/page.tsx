import { AccessGate } from "@/components/auth/AccessGate";
import { ProfileClient } from "@/components/account/ProfileClient";

export default function ProfilPage() {
  return (
    <AccessGate requiredModule="any" title="KASUS">
      <main className="page">
        <div className="shell">
          <ProfileClient />
        </div>
      </main>
    </AccessGate>
  );
}
