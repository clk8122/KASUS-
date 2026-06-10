import { KasusDashboardClient } from "@/components/account/KasusDashboardClient";
import { TopBar } from "@/components/layout/TopBar";

export default function KasusDashboardPage() {
  return (
    <main className="page">
      <div className="shell">
        <TopBar />
        <KasusDashboardClient />
      </div>
    </main>
  );
}
