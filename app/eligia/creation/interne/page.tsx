import { AccessGate } from "@/components/auth/AccessGate";
import { InternalDossierWizard } from "@/components/eligia/InternalDossierWizard";

export default function InternalCreationPage() {
  return (
    <AccessGate requiredModule="eligia" title="KASUS">
      <main className="page">
        <div className="shell">
          <InternalDossierWizard />
        </div>
      </main>
    </AccessGate>
  );
}
