import { AccessGate } from "@/components/auth/AccessGate";
import { ArrowUpRight, FileCheck2, FolderPlus, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export default function EligiaMenuPage() {
  return (
    <AccessGate requiredModule="eligia" title="KASUS" subtitle="Module locatif réservé aux comptes abonnés.">
      <main className="page eligia-menu-page">
        <div className="shell">
          <section className="eligia-hero eligia-landing glass">
            <div className="eligia-hero-copy">
              <p className="eyebrow">Module locatif</p>
              <h1>ELIGIA</h1>
              <p>
                Une interface éditoriale pour piloter vos dossiers candidats, garder la main sur les pièces et relancer sans friction.
              </p>
              <div className="eligia-hero-pills">
                <span><Sparkles size={14} /> Dossiers réels</span>
                <span><ShieldCheck size={14} /> Contrôle humain</span>
                <span><FileCheck2 size={14} /> Analyse documentaire</span>
              </div>
            </div>

            <div className="eligia-hero-rail">
              <article className="eligia-rail-card">
                <FolderPlus size={24} />
                <div>
                  <strong>Nouveau dossier</strong>
                  <p>Créer un dossier depuis l’agence ou générer un lien candidat propre.</p>
                </div>
                <Link className="btn btn-primary btn-compact" href="/eligia/creation">
                  Démarrer <ArrowUpRight size={18} />
                </Link>
              </article>
              <article className="eligia-rail-card">
                <FileCheck2 size={24} />
                <div>
                  <strong>Mes dossiers</strong>
                  <p>Consulter, relancer et finaliser les candidatures enregistrées.</p>
                </div>
                <Link className="btn btn-compact" href="/eligia/dossiers">
                  Ouvrir <ArrowUpRight size={18} />
                </Link>
              </article>
            </div>
          </section>

          <section className="eligia-grid">
            <Link className="eligia-feature-card glass" href="/eligia/dossiers">
              <span className="eligia-feature-icon">
                <FileCheck2 size={22} />
              </span>
              <div>
                <p className="eyebrow">Pilotage</p>
                <h2>Mes dossiers</h2>
                <p>Accédez à la liste réelle des candidatures, au détail, aux relances et aux exports.</p>
              </div>
              <span className="module-open">Ouvrir <ArrowUpRight size={18} /></span>
            </Link>

            <Link className="eligia-feature-card glass" href="/eligia/creation">
              <span className="eligia-feature-icon">
                <FolderPlus size={22} />
              </span>
              <div>
                <p className="eyebrow">Création</p>
                <h2>Créer un dossier</h2>
                <p>Structurer un dossier ou générer un lien candidat à transmettre.</p>
              </div>
              <span className="module-open">Démarrer <ArrowUpRight size={18} /></span>
            </Link>
          </section>
        </div>
      </main>
    </AccessGate>
  );
}
