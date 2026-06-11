import { AccessGate } from "@/components/auth/AccessGate";
import { ModuleVault } from "@/components/account/ModuleVault";

export default function HomePage() {
  return (
    <AccessGate title="KASUS" requiredModule="any">
      <ModuleVault />
    </AccessGate>
  );
}
