import { AccessGate } from "@/components/auth/AccessGate";
import Link from "next/link";

export default function EligiaMenuPage() {
  return (
    <AccessGate requiredModule="eligia" title="KASUS">
      <main className="page eligia-menu-page">
        <div className="shell">
          <section className="eligia-simple-landing glass">
            <h1 className="eligia-page-title">ELIGIA</h1>
            <div className="eligia-quick-grid">
              <Link className="eligia-quick-card glass" href="/eligia/dossiers">
                <span>Mes dossiers</span>
              </Link>
              <Link className="eligia-quick-card glass" href="/eligia/creation">
                <span>Créer un dossier</span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </AccessGate>
  );
}
