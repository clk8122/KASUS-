import { AccessGate } from "@/components/auth/AccessGate";
import { FolderPlus, FileCheck2, ArrowUpRight } from "lucide-react";
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
                <FileCheck2 size={24} />
                <span>Mes dossiers</span>
                <ArrowUpRight size={18} />
              </Link>
              <Link className="eligia-quick-card glass" href="/eligia/creation">
                <FolderPlus size={24} />
                <span>Créer un dossier</span>
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </AccessGate>
  );
}
