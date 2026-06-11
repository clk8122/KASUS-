import { AccessGate } from "@/components/auth/AccessGate";
import { SystemStatusClient } from "@/components/system/SystemStatusClient";

export default function SystemePage() {
  return (
    <AccessGate requiredModule="any" title="KASUS">
      <main className="page">
        <div className="shell">
          <SystemStatusClient />
        </div>
      </main>
    </AccessGate>
  );
}
