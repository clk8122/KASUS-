export type FinancialSignal = {
  label: string;
  tone: "neutral" | "positive" | "warning";
};

export function buildIndicativeFinancialSignals(rent: number, tenantIncome: number, guarantorIncome?: number): FinancialSignal[] {
  const tenantRatio = rent > 0 ? tenantIncome / rent : 0;
  const guarantorRatio = guarantorIncome && rent > 0 ? guarantorIncome / rent : 0;

  return [
    {
      label: tenantRatio >= 3 ? "Revenus locataires cohérents avec le loyer demandé" : "Revenus locataires à examiner avec prudence",
      tone: tenantRatio >= 3 ? "positive" : "warning"
    },
    {
      label: "Lecture indicative, sans décision automatique",
      tone: "neutral"
    },
    {
      label: guarantorRatio ? (guarantorRatio >= 4 ? "Garant financièrement solide" : "Garant à examiner avec prudence") : "Garant à vérifier si applicable",
      tone: guarantorRatio >= 4 ? "positive" : "neutral"
    },
    {
      label: "Decision finale humaine par l'agence, le bailleur ou l'assureur GLI",
      tone: "neutral"
    }
  ];
}
