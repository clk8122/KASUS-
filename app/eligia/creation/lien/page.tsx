import { AccessGate } from "@/components/auth/AccessGate";
import { CandidateLinkGenerator } from "@/components/eligia/CandidateLinkGenerator";

export default function LinkCreationPage() {
  return (
    <AccessGate requiredModule="eligia" title="KASUS" subtitle="Générer un vrai lien candidat.">
      <main className="page">
        <div className="shell">
          <CandidateLinkGenerator />
        </div>
      </main>
    </AccessGate>
  );
}
