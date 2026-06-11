import { Suspense } from "react";
import { CandidatePortalFlow } from "@/components/eligia/CandidatePortalFlow";
import { TopBar } from "@/components/layout/TopBar";

export default function CandidatePortalPage() {
  return (
    <main className="page">
      <div className="shell">
        <TopBar showProfileMenu={false} />
        <Suspense fallback={<section className="candidate-flow glass"><p>Chargement du portail candidat...</p></section>}>
          <CandidatePortalFlow />
        </Suspense>
      </div>
    </main>
  );
}
