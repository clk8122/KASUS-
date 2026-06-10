export const demoDossiers = [
  {
    id: "demo-dossier",
    address: "12 rue du Parc, 54000 Nancy",
    candidates: "Camille Martin",
    rent: 780,
    status: "Pré-analyse disponible",
    completeness: 86,
    indicator: "Points à vérifier",
    link: "http://localhost:3000/candidat/demo-link"
  },
  {
    id: "pending-link",
    address: "4 avenue Foch, 54000 Nancy",
    candidates: "Non renseigné",
    rent: 920,
    status: "Lien candidat envoyé",
    completeness: 12,
    indicator: "En attente du candidat",
    link: "http://localhost:3000/candidat/demo-link"
  }
];

export const demoDossierDetail = {
  address: "12 rue du Parc, 54000 Nancy",
  rent: 780,
  completeness: 86,
  status: "Pré-analyse disponible",
  people: [
    {
      id: "camille",
      name: "Camille Martin",
      role: "Locataire",
      situation: "Salariée en CDI",
      housingStatus: "Locataire actuelle",
      monthlyIncome: 2450,
      taxNoticeIncome: 29400,
      rentRatio: 3.1,
      documents: ["Pièce d'identité", "3 bulletins de salaire", "Contrat de travail", "Dernier avis d'imposition"],
      missing: ["Quittance de loyer récente"]
    },
    {
      id: "julien",
      name: "Julien Martin",
      role: "Garant",
      situation: "Cadre en CDI",
      housingStatus: "Propriétaire",
      monthlyIncome: 3600,
      taxNoticeIncome: 43200,
      rentRatio: 4.6,
      documents: ["Pièce d'identité", "Avis de taxe foncière", "Dernier avis d'imposition", "Bulletins de salaire"],
      missing: ["Justificatif de domicile récent"]
    }
  ],
  solvency: {
    score: 82,
    label: "Solvabilité favorable avec points à vérifier",
    details: "Les revenus sont cohérents avec le loyer. Le garant renforce le dossier. Il reste à vérifier les justificatifs récents."
  },
  summary:
    "Camille Martin candidate pour le logement situé 12 rue du Parc à Nancy, avec un loyer charges comprises de 780 EUR. Elle est salariée en CDI et ses revenus mensuels sont d'environ 2 450 EUR. Julien Martin se porte garant, avec environ 3 600 EUR de revenus mensuels et un statut de propriétaire. Le dossier est favorable, sous réserve de recevoir la quittance de loyer récente de Camille Martin et le justificatif de domicile récent du garant."
};

export const agencyProfile = {
  agencyName: "votre agence",
  firstName: "",
  lastName: "",
  email: "contact@agence-a-completer.fr",
  phone: ""
};

export const allowedUploadMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif"
];

export const maxUploadSizeMb = 20;
