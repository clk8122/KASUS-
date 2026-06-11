import { AccessGate } from "@/components/auth/AccessGate";
import { SystemStatusClient } from "@/components/system/SystemStatusClient";
import { TopBar } from "@/components/layout/TopBar";

export default function SystemePage() {
  return (
    <AccessGate requiredModule="any" title="KASUS">
      <main className="page">
        <div className="shell">
          <TopBar />
          <SystemStatusClient />
        </div>
      </main>
    </AccessGate>
  );
}
