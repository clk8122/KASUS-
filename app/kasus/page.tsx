import { AccessGate } from "@/components/auth/AccessGate";
import { ModuleVault } from "@/components/account/ModuleVault";

export default function KasusDashboardPage() {
  return (
    <AccessGate title="KASUS" requiredModule="any">
      <ModuleVault />
    </AccessGate>
  );
}
