import { ProfileClient } from "@/components/account/ProfileClient";
import { TopBar } from "@/components/layout/TopBar";

export default function ProfilPage() {
  return (
    <main className="page">
      <div className="shell">
        <TopBar backHref="/kasus" />
        <ProfileClient />
      </div>
    </main>
  );
}
