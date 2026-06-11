import { AccessGate } from "@/components/auth/AccessGate";
import { SubscriptionClient } from "@/components/account/SubscriptionClient";
import { TopBar } from "@/components/layout/TopBar";

export default function AbonnementPage() {
  return (
    <AccessGate allowWithoutSubscription requiredModule="any" title="KASUS">
      <main className="page">
        <div className="shell">
          <TopBar />
          <SubscriptionClient />
        </div>
      </main>
    </AccessGate>
  );
}
