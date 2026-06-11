import { AccessGate } from "@/components/auth/AccessGate";
import { DossiersClient } from "@/components/eligia/DossiersClient";

export default function DossiersPage() {
  return (
    <AccessGate requiredModule="eligia" title="KASUS">
      <main className="page">
        <div className="shell">
          <DossiersClient />
        </div>
      </main>
    </AccessGate>
  );
}
