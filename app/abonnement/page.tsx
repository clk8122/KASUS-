import { AccessGate } from "@/components/auth/AccessGate";
import { SubscriptionClient } from "@/components/account/SubscriptionClient";
import { TopBar } from "@/components/layout/TopBar";

export default function AbonnementPage() {
  return (
    <AccessGate allowWithoutSubscription requiredModule="any" title="KASUS" subtitle="Choisissez un module pour accéder au site.">
      <main className="page">
        <div className="shell">
          <TopBar backHref="/kasus" />
          <SubscriptionClient />
        </div>
      </main>
    </AccessGate>
  );
}
