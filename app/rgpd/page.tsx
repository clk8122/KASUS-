import { TopBar } from "@/components/layout/TopBar";

export default function RgpdPage() {
  return (
    <main className="page">
      <div className="shell">
        <TopBar backHref="/kasus" />
        <section style={{ padding: "54px 0" }}>
          <div className="glass panel" style={{ margin: "0 auto", maxWidth: 880 }}>
            <h1 className="title-md">RGPD</h1>
            <div className="list" style={{ marginTop: 24 }}>
              {[
                ["Donnees collectees", "Coordonnees agence, informations de dossier, pieces justificatives autorisees, metadonnees techniques strictement necessaires."],
                ["Finalites", "Organisation, verification, synthese et aide a la lecture des dossiers locatifs."],
                ["Conservation", "Liens candidats expires par defaut apres 10 jours. Les dossiers doivent etre supprimables selon la politique de conservation de l'organisation."],
                ["Droits", "Acces, rectification, suppression, limitation et contact RGPD a completer."],
                ["Aide automatisee", "ELIGIA ne prend pas de decision finale. Toute decision reste humaine."]
              ].map(([title, body]) => (
                <section className="glass panel" key={title}><h2>{title}</h2><p className="muted">{body}</p></section>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
