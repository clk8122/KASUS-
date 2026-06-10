import { AccessGate } from "@/components/auth/AccessGate";
import { TopBar } from "@/components/layout/TopBar";

export default function StudioPage() {
  return (
    <AccessGate requiredModule="studio" title="KASUS" subtitle="Module STUDIO réservé aux abonnés.">
      <main className="page">
        <div className="shell">
          <TopBar backHref="/kasus" />
          <section className="empty-state glass">
            <h1>STUDIO</h1>
            <p>Le module est en cours de mise en production. Son accès sera débloqué après abonnement.</p>
          </section>
        </div>
      </main>
    </AccessGate>
  );
}
