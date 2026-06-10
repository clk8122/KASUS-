import { InternalDossierWizard } from "@/components/eligia/InternalDossierWizard";
import { TopBar } from "@/components/layout/TopBar";

export default function InternalCreationPage() {
  return (
    <main className="page">
      <div className="shell">
        <TopBar backHref="/eligia/creation" smallKasus notifications eligiaProfile />
        <InternalDossierWizard />
      </div>
    </main>
  );
}
