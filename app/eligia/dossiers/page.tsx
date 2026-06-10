import { AccessGate } from "@/components/auth/AccessGate";
import { TopBar } from "@/components/layout/TopBar";
import { DossiersClient } from "@/components/eligia/DossiersClient";

export default function DossiersPage() {
  return (
    <AccessGate requiredModule="eligia" title="KASUS" subtitle="Liste réelle des dossiers enregistrés.">
      <main className="page">
        <div className="shell">
          <TopBar backHref="/eligia" smallKasus notifications eligiaProfile />
          <DossiersClient />
        </div>
      </main>
    </AccessGate>
  );
}
