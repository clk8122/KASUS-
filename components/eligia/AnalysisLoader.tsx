"use client";

import { FileSearch } from "lucide-react";
import type { CSSProperties } from "react";

type AnalysisLoaderProps = {
  progress: number;
  fileCount?: number;
};

const stages = [
  { until: 30, label: "Lecture des pièces" },
  { until: 55, label: "Classification des documents" },
  { until: 80, label: "Vérification des informations" },
  { until: 101, label: "Rédaction du compte rendu" }
];

/**
 * Indicateur d'analyse unique, partagé par le parcours agence et le portail
 * candidat : un anneau de progression, l'étape en cours, une barre fine.
 * Volontairement sans chronomètre ni métriques annexes.
 */
export function AnalysisLoader({ progress, fileCount }: AnalysisLoaderProps) {
  const stage = stages.find((item) => progress < item.until) ?? stages[stages.length - 1];

  return (
    <div className="analysis-stage">
      <div
        className="analysis-ring"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        style={{ "--analysis-progress": `${Math.max(progress, 4)}%` } as CSSProperties}
      >
        <span className="analysis-ring-core">
          <FileSearch size={26} />
        </span>
      </div>
      <h2>Analyse du dossier</h2>
      <p className="analysis-stage-label" key={stage.label}>
        {stage.label}
        <span className="analysis-dots" />
      </p>
      <div className="analysis-stage-bar">
        <span style={{ width: `${progress}%` }} />
      </div>
      {fileCount ? (
        <small>
          {fileCount} pièce{fileCount > 1 ? "s" : ""} transmise{fileCount > 1 ? "s" : ""}
        </small>
      ) : null}
    </div>
  );
}
