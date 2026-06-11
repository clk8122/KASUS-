import { AccessGate } from "@/components/auth/AccessGate";

export default function StudioPage() {
  return (
    <AccessGate requiredModule="studio" title="KASUS">
      <main className="page">
        <div className="shell">
          <section className="empty-state glass">
            <h1>STUDIO</h1>
            <p>Le module est en cours de mise en production. Son accès sera débloqué après abonnement.</p>
          </section>
        </div>
      </main>
    </AccessGate>
  );
}
