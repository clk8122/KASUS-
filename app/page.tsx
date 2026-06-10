import { AccessGate } from "@/components/auth/AccessGate";
import { KasusDashboardClient } from "@/components/account/KasusDashboardClient";

export default function HomePage() {
  return (
    <AccessGate title="KASUS" subtitle="Connexion, abonnement et espace de travail sécurisé." requiredModule="any">
      <KasusDashboardClient />
    </AccessGate>
  );
}
