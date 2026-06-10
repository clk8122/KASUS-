import { SubscriptionClient } from "@/components/account/SubscriptionClient";
import { TopBar } from "@/components/layout/TopBar";

export default function AbonnementPage() {
  return (
    <main className="page">
      <div className="shell">
        <TopBar backHref="/profil" />
        <SubscriptionClient />
      </div>
    </main>
  );
}
