import Link from "next/link";

type MvpDossierDetailProps = {
  id: string;
};

export function MvpDossierDetail({ id }: MvpDossierDetailProps) {
  return (
    <section className="empty-state glass">
      <h1>Vue héritée du dossier</h1>
      <p>La fiche détaillée réelle est désormais disponible dans ELIGIA pour le dossier {id}.</p>
      <Link className="btn btn-primary" href="/eligia/dossiers">
        Retour aux dossiers
      </Link>
    </section>
  );
}
