import { AccessGate } from "@/components/auth/AccessGate";
import { DossiersClient } from "@/components/eligia/DossiersClient";
import { TopBar } from "@/components/layout/TopBar";

export default function DossiersPage() {
  return (
    <AccessGate requiredModule="eligia" title="KASUS">
      <main className="page">
        <div className="shell">
          <TopBar eligiaProfile />
          <DossiersClient />
        </div>
      </main>
    </AccessGate>
  );
}
