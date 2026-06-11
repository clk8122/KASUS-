export default function RgpdPage() {
  return (
    <main className="page">
      <div className="shell">
        <section style={{ padding: "54px 0" }}>
          <div className="glass panel" style={{ margin: "0 auto", maxWidth: 880 }}>
            <h1 className="title-md">RGPD</h1>
            <div className="list" style={{ marginTop: 24 }}>
              {[
                ["Données collectées", "Coordonnées agence, informations de dossier, pièces justificatives autorisées, métadonnées techniques strictement nécessaires."],
                ["Finalités", "Organisation, vérification, synthèse et aide à la lecture des dossiers locatifs."],
                ["Conservation", "Liens candidats expirent par défaut après 10 jours. Les dossiers doivent être supprimables selon la politique de conservation de l'organisation."],
                ["Droits", "Accès, rectification, suppression, limitation et contact RGPD à compléter."],
                ["Aide automatisée", "ELIGIA ne prend pas de décision finale. Toute décision reste humaine."]
              ].map(([title, body]) => (
                <section className="glass panel" key={title}>
                  <h2>{title}</h2>
                  <p className="muted">{body}</p>
                </section>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
