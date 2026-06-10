import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";

export default function EligiaMenuPage() {
  return (
    <main className="page eligia-menu-page">
      <div className="shell">
        <TopBar smallKasus notifications eligiaProfile />
        <section className="eligia-menu-typographic">
          <div className="eligia-menu-title">
            <span>Module locatif</span>
            <h1>ELIGIA</h1>
            <p>Gestion de vos dossiers</p>
          </div>
          <div className="eligia-menu-lines">
            <Link className="eligia-menu-line" href="/eligia/dossiers">
              <div>
                <strong>Mes dossiers</strong>
                <small>Consulter, relancer et finaliser les candidatures.</small>
              </div>
              <ArrowUpRight size={24} />
            </Link>
            <Link className="eligia-menu-line" href="/eligia/creation">
              <div>
                <strong>Nouveau dossier</strong>
                <small>Déposer des pièces ou générer un lien candidat.</small>
              </div>
              <ArrowUpRight size={24} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
