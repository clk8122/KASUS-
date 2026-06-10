import { AccessGate } from "@/components/auth/AccessGate";
import { TopBar } from "@/components/layout/TopBar";
import { CandidatePortalFlow } from "@/components/eligia/CandidatePortalFlow";

export default function LinkCreationPage() {
  return (
    <AccessGate requiredModule="eligia" title="KASUS" subtitle="Générer un vrai lien candidat.">
      <main className="page">
        <div className="shell">
          <TopBar backHref="/eligia/creation" smallKasus notifications eligiaProfile />
          <CandidatePortalFlow />
        </div>
      </main>
    </AccessGate>
  );
}
