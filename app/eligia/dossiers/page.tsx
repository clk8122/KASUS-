"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { deleteEligiaDossier, EligiaMvpDossier, readEligiaDossiers } from "@/lib/eligia-mvp";
import { demoDossiers } from "@/lib/mock-data";

function demoAsMvp(): EligiaMvpDossier[] {
  return demoDossiers.map((dossier) => ({
    ...dossier,
    createdAt: new Date().toISOString(),
    source: dossier.id === "pending-link" ? "link" : "agency-upload",
    status: dossier.status as EligiaMvpDossier["status"],
    files: [],
    people: [],
    summary: dossier.indicator
  }));
}

export default function DossiersPage() {
  const [chooserOpen, setChooserOpen] = useState(false);
  const [createdDossiers, setCreatedDossiers] = useState<EligiaMvpDossier[]>(() => readEligiaDossiers());
  const [deletedDemoIds, setDeletedDemoIds] = useState<Set<string>>(() => new Set());

  const dossiers = useMemo(
    () => [...createdDossiers, ...demoAsMvp().filter((dossier) => !deletedDemoIds.has(dossier.id))],
    [createdDossiers, deletedDemoIds]
  );

  function removeDossier(dossier: EligiaMvpDossier) {
    if (!window.confirm("Supprimer ce dossier ?")) return;
    if (dossier.id.startsWith("demo") || dossier.id === "pending-link") {
      setDeletedDemoIds((current) => new Set(current).add(dossier.id));
      return;
    }
    deleteEligiaDossier(dossier.id);
    setCreatedDossiers(readEligiaDossiers());
  }

  return (
    <main className="page">
      <div className="shell">
        <TopBar backHref="/eligia" smallKasus notifications eligiaProfile />
        <section className="dossiers-page">
          <div className="dossiers-heading">
            <div>
              <p className="eyebrow">ELIGIA</p>
              <h1>Mes dossiers</h1>
            </div>
            <div className="relative">
              <button aria-expanded={chooserOpen} aria-label="Créer un dossier" className="icon-btn" onClick={() => setChooserOpen((value) => !value)} type="button">
                <Plus size={19} />
              </button>
              {chooserOpen ? (
                <div className="menu">
                  <Link href="/eligia/creation/interne">Créer le dossier moi-même</Link>
                  <Link href="/eligia/creation/lien">Générer un lien candidat</Link>
                </div>
              ) : null}
            </div>
          </div>

          <div className="simple-dossier-list">
            {dossiers.map((dossier) => (
              <article className="simple-dossier-row glass" key={dossier.id}>
                <Link className="simple-dossier-main" href={`/eligia/dossiers/${dossier.id}`}>
                  <div className="simple-dossier-copy">
                    <strong>{dossier.address}</strong>
                    <small>{dossier.candidates}</small>
                  </div>
                  <div className="simple-dossier-meta">
                    <span>{dossier.indicator}</span>
                    {dossier.completeness >= 100 ? <em>Complet</em> : null}
                  </div>
                </Link>
                <button className="icon-btn delete-dossier-btn" onClick={() => removeDossier(dossier)} type="button" aria-label={`Supprimer ${dossier.address}`}>
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
