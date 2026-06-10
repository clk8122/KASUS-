import { AccessGate } from "@/components/auth/AccessGate";
import { ModuleVault } from "@/components/account/ModuleVault";

export default function HomePage() {
  return (
    <AccessGate title="KASUS" subtitle="Connexion, abonnement et espace de travail sécurisé." requiredModule="any">
      <ModuleVault />
    </AccessGate>
  );
}
