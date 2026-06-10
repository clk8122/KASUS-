import { AccessGate } from "@/components/auth/AccessGate";
import { KasusDashboardClient } from "@/components/account/KasusDashboardClient";

export default function KasusDashboardPage() {
  return (
    <AccessGate title="KASUS" subtitle="Accès réservé aux comptes abonnés." requiredModule="any">
      <KasusDashboardClient />
    </AccessGate>
  );
}
