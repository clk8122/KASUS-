import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AccessGate } from "@/components/auth/AccessGate";

export default function CreationChoicePage() {
  return (
    <AccessGate requiredModule="eligia" title="KASUS">
      <main className="page">
        <div className="shell">
          <section className="eligia-simple-page">
            <div className="eligia-simple-heading">
              <p className="eyebrow">ELIGIA</p>
              <h1>Créer un dossier</h1>
              <p className="muted">Choisissez le mode de création.</p>
            </div>
            <div className="choice-panel glass">
              <Link className="choice-row" href="/eligia/creation/interne">
                <span>
                  <strong>Créer le dossier maintenant</strong>
                  <small>Ajouter les pièces directement depuis l’agence.</small>
                </span>
                <ArrowUpRight size={22} />
              </Link>
              <Link className="choice-row" href="/eligia/creation/lien">
                <span>
                  <strong>Générer un lien candidat</strong>
                  <small>Le candidat complète et téléverse ses documents.</small>
                </span>
                <ArrowUpRight size={22} />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </AccessGate>
  );
}
