import { Link as LinkIcon, Upload } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";

export default function CreationChoicePage() {
  return (
    <main className="page">
      <div className="shell">
        <TopBar backHref="/eligia" smallKasus notifications eligiaProfile />
        <section className="eligia-simple-page">
          <div className="eligia-simple-heading">
            <p className="eyebrow">ELIGIA</p>
            <h1>Création d'un dossier</h1>
          </div>
          <div className="choice-panel glass">
            <Link className="choice-row" href="/eligia/creation/interne">
              <Upload size={22} />
              <span>
                <strong>Créer le dossier moi-même</strong>
                <small>Vous avez déjà les pièces justificatives du candidat.</small>
              </span>
            </Link>
            <Link className="choice-row" href="/eligia/creation/lien">
              <LinkIcon size={22} />
              <span>
                <strong>Générer un lien candidat</strong>
                <small>Le candidat complète lui-même son dossier.</small>
              </span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
