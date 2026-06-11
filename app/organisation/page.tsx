import { AccessGate } from "@/components/auth/AccessGate";
import { OrganizationClient } from "@/components/account/OrganizationClient";
import { TopBar } from "@/components/layout/TopBar";

export default function OrganisationPage() {
  return (
    <AccessGate requiredModule="any" title="KASUS">
      <main className="page">
        <div className="shell">
          <TopBar />
          <OrganizationClient />
        </div>
      </main>
    </AccessGate>
  );
}
