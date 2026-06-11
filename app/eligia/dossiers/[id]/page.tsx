import { AccessGate } from "@/components/auth/AccessGate";
import { DossierDetailClient } from "@/components/eligia/DossierDetailClient";

type DossierDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DossierDetailPage({ params }: DossierDetailPageProps) {
  const { id } = await params;

  return (
    <AccessGate requiredModule="eligia" title="KASUS" subtitle="Détail d'un dossier réel.">
      <main className="page">
        <div className="shell">
          <DossierDetailClient id={id} />
        </div>
      </main>
    </AccessGate>
  );
}
