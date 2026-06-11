import { AccessGate } from "@/components/auth/AccessGate";
import { OrganizationClient } from "@/components/account/OrganizationClient";

export default function OrganisationPage() {
  return (
    <AccessGate requiredModule="any" title="KASUS">
      <main className="page">
        <div className="shell">
          <OrganizationClient />
        </div>
      </main>
    </AccessGate>
  );
}
