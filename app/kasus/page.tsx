import { AccessGate } from "@/components/auth/AccessGate";
import { ModuleVault } from "@/components/account/ModuleVault";

export default function KasusDashboardPage() {
  return (
    <AccessGate title="KASUS" subtitle="Accès réservé aux comptes abonnés." requiredModule="any">
      <ModuleVault />
    </AccessGate>
  );
}
