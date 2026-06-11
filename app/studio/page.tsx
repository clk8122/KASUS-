import { PenLine } from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";
import { TopBar } from "@/components/layout/TopBar";

export default function StudioPage() {
  return (
    <AccessGate requiredModule="studio" title="KASUS">
      <main className="page">
        <div className="shell">
          <TopBar />
          <section className="empty-state glass reveal">
            <span className="empty-state-icon">
              <PenLine size={26} />
            </span>
            <h1>STUDIO</h1>
            <p>
              Le module de création d&apos;annonces immobilières est en cours de mise en production. Son accès sera
              débloqué automatiquement après abonnement.
            </p>
          </section>
        </div>
      </main>
    </AccessGate>
  );
}
