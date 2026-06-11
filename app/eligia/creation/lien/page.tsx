import { AccessGate } from "@/components/auth/AccessGate";
import { CandidateLinkGenerator } from "@/components/eligia/CandidateLinkGenerator";
import { TopBar } from "@/components/layout/TopBar";

export default function LinkCreationPage() {
  return (
    <AccessGate requiredModule="eligia" title="KASUS">
      <main className="page">
        <div className="shell">
          <TopBar eligiaProfile />
          <CandidateLinkGenerator />
        </div>
      </main>
    </AccessGate>
  );
}
