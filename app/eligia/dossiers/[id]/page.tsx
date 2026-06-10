import { MvpDossierDetail } from "@/components/eligia/MvpDossierDetail";
import { TopBar } from "@/components/layout/TopBar";

type DossierDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DossierDetailPage({ params }: DossierDetailPageProps) {
  const { id } = await params;

  return (
    <main className="page">
      <div className="shell">
        <TopBar backHref="/eligia/dossiers" smallKasus notifications eligiaProfile />
        <MvpDossierDetail id={id} />
      </div>
    </main>
  );
}
