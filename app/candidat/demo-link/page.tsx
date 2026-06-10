import { Suspense } from "react";
import { CandidatePortalFlow } from "@/components/eligia/CandidatePortalFlow";

export default function CandidatePortalPage() {
  return (
    <main className="page">
      <div className="shell">
        <Suspense fallback={<section className="candidate-flow glass"><p>Chargement du portail candidat...</p></section>}>
          <CandidatePortalFlow />
        </Suspense>
      </div>
    </main>
  );
}
