import { OrganizationClient } from "@/components/account/OrganizationClient";
import { TopBar } from "@/components/layout/TopBar";

export default function OrganisationPage() {
  return (
    <main className="page">
      <div className="shell">
        <TopBar backHref="/profil" />
        <OrganizationClient />
      </div>
    </main>
  );
}
