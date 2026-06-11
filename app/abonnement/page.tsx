import { AccessGate } from "@/components/auth/AccessGate";
import { SubscriptionClient } from "@/components/account/SubscriptionClient";

export default function AbonnementPage() {
  return (
    <AccessGate allowWithoutSubscription requiredModule="any" title="KASUS">
      <main className="page">
        <div className="shell">
          <SubscriptionClient />
        </div>
      </main>
    </AccessGate>
  );
}
