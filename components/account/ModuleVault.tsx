"use client";

import { ArrowRight, Check, FileCheck2, LockKeyhole, PenLine, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/lib/use-account";
import { TopBar } from "@/components/layout/TopBar";

type ModuleKey = "eligia" | "studio";

type ModuleInfo = {
  key: ModuleKey;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  price: string;
  priceNote: string;
};

const modules: ModuleInfo[] = [
  {
    key: "eligia",
    title: "ELIGIA",
    tagline: "Dossiers locatifs",
    description: "Recevez, vérifiez et présentez des dossiers de candidature complets, sans tri manuel.",
    features: [
      "Lien candidat : le locataire dépose ses pièces lui-même",
      "Lecture automatique des documents et pièces manquantes détectées",
      "Score de solvabilité et synthèse claire, la décision reste humaine",
      "Compte rendu prêt à transmettre au propriétaire"
    ],
    price: "99 €",
    priceNote: "par mois"
  },
  {
    key: "studio",
    title: "STUDIO",
    tagline: "Annonces immobilières",
    description: "Créez des annonces et des supports soignés, aux couleurs de votre agence.",
    features: [
      "Annonces professionnelles mises en page en quelques minutes",
      "Visuels cohérents avec l'identité de votre agence",
      "Exports prêts à publier sur vos canaux"
    ],
    price: "99 €",
    priceNote: "par mois"
  }
];

function ModuleIcon({ moduleKey, size = 26 }: { moduleKey: ModuleKey; size?: number }) {
  return moduleKey === "eligia" ? <FileCheck2 size={size} /> : <PenLine size={size} />;
}

type ModuleVaultProps = {
  mode?: "landing" | "locked";
  showChrome?: boolean;
};

export function ModuleVault({ mode = "landing", showChrome = false }: ModuleVaultProps) {
  const router = useRouter();
  const { activeModules, startCheckout, signOut } = useAccount();
  const [selected, setSelected] = useState<ModuleKey | "">("");
  const [pending, setPending] = useState<ModuleKey | "">("");
  const currentModule = useMemo(() => modules.find((item) => item.key === selected) ?? null, [selected]);

  useEffect(() => {
    if (!selected) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected("");
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  async function subscribe(moduleKey: ModuleKey) {
    setPending(moduleKey);
    const payload = await startCheckout(moduleKey);
    if (payload?.error) {
      setPending("");
    }
  }

  function openModule(moduleKey: ModuleKey) {
    setSelected("");
    router.push(moduleKey === "eligia" ? "/eligia" : "/studio");
  }

  return (
    <section className="vault-shell">
      {showChrome ? (
        <div className="shell vault-shell-chrome">
          <TopBar />
        </div>
      ) : null}
      <div className="vault-hero glass vault-hero-landing">
        <div className="vault-hero-copy vault-hero-copy-center">
          <h1 className="vault-title">KASUS</h1>
        </div>
      </div>

      <div className="module-tile-grid">
        {modules.map((module) => {
          const active = activeModules.includes(module.key);
          return (
            <button
              className={`module-tile ${active ? "module-tile-active" : ""}`}
              key={module.key}
              onClick={() => (active ? openModule(module.key) : setSelected(module.key))}
              type="button"
            >
              <span className="module-tile-icon">
                <ModuleIcon moduleKey={module.key} />
              </span>
              <div className="module-tile-copy">
                <h2>{module.title}</h2>
                <p>{module.tagline}</p>
              </div>
              <div className="module-tile-foot">
                {active ? (
                  <span className="module-tile-state module-tile-state-on">
                    <Check size={14} /> Actif
                  </span>
                ) : (
                  <span className="module-tile-state">
                    <LockKeyhole size={14} /> Verrouillé
                  </span>
                )}
                <span className="module-tile-go">
                  {active ? "Ouvrir" : "Découvrir"} <ArrowRight size={16} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {currentModule ? (
        <div
          aria-modal="true"
          className="vault-modal-scrim"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelected("");
          }}
          role="dialog"
        >
          <section className="module-sheet">
            <button aria-label="Fermer" className="vault-close" onClick={() => setSelected("")} type="button">
              <X size={17} />
            </button>
            <span className="module-tile-icon module-sheet-icon">
              <ModuleIcon moduleKey={currentModule.key} size={30} />
            </span>
            <div className="module-sheet-heading">
              <h2>{currentModule.title}</h2>
              <p>{currentModule.description}</p>
            </div>
            <ul className="module-sheet-features">
              {currentModule.features.map((feature) => (
                <li key={feature}>
                  <span className="module-sheet-check">
                    <Check size={14} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="module-sheet-footer">
              <div className="module-sheet-price">
                <strong>{currentModule.price}</strong>
                <span>{currentModule.priceNote}</span>
              </div>
              <button
                className="btn btn-primary"
                disabled={pending === currentModule.key}
                onClick={() => void subscribe(currentModule.key)}
                type="button"
              >
                {pending === currentModule.key ? "Ouverture..." : `S'abonner à ${currentModule.title}`}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {mode === "locked" ? (
        <div className="vault-footer">
          <button className="btn btn-compact" onClick={() => void signOut()} type="button">
            Déconnexion
          </button>
        </div>
      ) : null}
    </section>
  );
}
