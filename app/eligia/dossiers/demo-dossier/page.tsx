import { MvpDossierDetail } from "@/components/eligia/MvpDossierDetail";
import { TopBar } from "@/components/layout/TopBar";

export default function DossierDetailPage() {
  return (
    <main className="page">
      <div className="shell">
        <TopBar backHref="/eligia/dossiers" smallKasus notifications eligiaProfile />
        <MvpDossierDetail id="demo-dossier" />
      </div>
    </main>
  );
}
