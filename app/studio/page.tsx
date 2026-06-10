import { TopBar } from "@/components/layout/TopBar";

export default function StudioPage() {
  return (
    <main className="page">
      <div className="shell">
        <TopBar smallKasus />
        <section className="hero-center">
          <div className="center-stack">
            <span className="badge">En cours de creation</span>
            <h1 className="title-lg">STUDIO</h1>
            <p className="subtitle">Le module STUDIO permettra de transformer les informations d'un bien en annonce immobiliere claire, professionnelle et prete a publier.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
