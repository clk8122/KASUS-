import { AccessGate } from "@/components/auth/AccessGate";
import { TopBar } from "@/components/layout/TopBar";

export default function StudioPage() {
  return (
    <AccessGate requiredModule="studio" title="KASUS">
      <main className="page">
        <div className="shell">
          <TopBar />
          <section className="empty-state glass">
            <h1>STUDIO</h1>
            <p>Le module est en cours de mise en production. Son accÃ¨s sera dÃ©bloquÃ© aprÃ¨s abonnement.</p>
          </section>
        </div>
      </main>
    </AccessGate>
  );
}
