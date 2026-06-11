import { AccessGate } from "@/components/auth/AccessGate";
import { InternalDossierWizard } from "@/components/eligia/InternalDossierWizard";
import { TopBar } from "@/components/layout/TopBar";

export default function InternalCreationPage() {
  return (
    <AccessGate requiredModule="eligia" title="KASUS">
      <main className="page">
        <div className="shell">
          <TopBar eligiaProfile />
          <InternalDossierWizard />
        </div>
      </main>
    </AccessGate>
  );
}
