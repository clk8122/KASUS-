import { AccessGate } from "@/components/auth/AccessGate";
import { DossierDetailClient } from "@/components/eligia/DossierDetailClient";
import { TopBar } from "@/components/layout/TopBar";

type DossierDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DossierDetailPage({ params }: DossierDetailPageProps) {
  const { id } = await params;

  return (
    <AccessGate requiredModule="eligia" title="KASUS">
      <main className="page">
        <div className="shell">
          <TopBar eligiaProfile />
          <DossierDetailClient id={id} />
        </div>
      </main>
    </AccessGate>
  );
}
