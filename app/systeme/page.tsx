import { TopBar } from "@/components/layout/TopBar";
import { SystemStatusClient } from "@/components/system/SystemStatusClient";

export default function SystemePage() {
  return (
    <main className="page">
      <div className="shell">
        <TopBar backHref="/kasus" />
        <SystemStatusClient />
      </div>
    </main>
  );
}
