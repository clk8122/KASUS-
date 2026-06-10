import { AccessGate } from "@/components/auth/AccessGate";
import { InternalDossierWizard } from "@/components/eligia/InternalDossierWizard";
import { TopBar } from "@/components/layout/TopBar";

export default function InternalCreationPage() {
  return (
    <AccessGate requiredModule="eligia" title="KASUS" subtitle="Créer un dossier réel depuis l'agence.">
      <main className="page">
        <div className="shell">
          <TopBar backHref="/eligia/creation" smallKasus notifications eligiaProfile />
          <InternalDossierWizard />
        </div>
      </main>
    </AccessGate>
  );
}
