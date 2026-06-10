export type ApplicantRole = "tenant" | "guarantor";
export type WorkStatus =
  | "cdi"
  | "cdd"
  | "civil-servant"
  | "self-employed"
  | "micro-entrepreneur"
  | "retired"
  | "student"
  | "apprentice"
  | "job-seeker"
  | "social-benefits"
  | "rsa"
  | "other";
export type HousingStatus = "tenant" | "owner" | "hosted" | "unknown";

export type DocumentCategory = "identity" | "domicile" | "professional" | "resources";

export type RentalDocumentRule = {
  id: string;
  category: DocumentCategory;
  label: string;
  detail?: string;
  roles: ApplicantRole[];
  workStatuses?: WorkStatus[];
  housingStatuses?: HousingStatus[];
  oneOfGroup?: string;
};

export const legalNotice =
  "Liste indicative construite d'après les pièces autorisées par le décret n° 2015-1437 et Service-Public. Une validation juridique humaine reste nécessaire avant production.";

export const rentalDocumentRules: RentalDocumentRule[] = [
  {
    id: "identity-main",
    category: "identity",
    label: "Pièce d'identité en cours de validité",
    detail: "Carte d'identité, passeport, permis de conduire ou titre de séjour autorisé selon le profil.",
    roles: ["tenant", "guarantor"],
    oneOfGroup: "identity"
  },
  {
    id: "domicile-tenant-rent-receipts",
    category: "domicile",
    label: "Trois dernières quittances de loyer ou attestation du bailleur",
    roles: ["tenant"],
    housingStatuses: ["tenant"],
    oneOfGroup: "tenant-domicile"
  },
  {
    id: "domicile-tenant-owner",
    category: "domicile",
    label: "Dernier avis de taxe foncière ou titre de propriété",
    roles: ["tenant"],
    housingStatuses: ["owner"],
    oneOfGroup: "tenant-domicile"
  },
  {
    id: "domicile-tenant-hosted",
    category: "domicile",
    label: "Attestation d'hébergement",
    roles: ["tenant"],
    housingStatuses: ["hosted"],
    oneOfGroup: "tenant-domicile"
  },
  {
    id: "domicile-tenant-host-id",
    category: "domicile",
    label: "Pièce d'identité de l'hébergeur",
    roles: ["tenant"],
    housingStatuses: ["hosted"]
  },
  {
    id: "domicile-tenant-host-proof",
    category: "domicile",
    label: "Justificatif de domicile de l'hébergeur : quittances ou taxe foncière",
    roles: ["tenant"],
    housingStatuses: ["hosted"]
  },
  {
    id: "domicile-tenant-election",
    category: "domicile",
    label: "Attestation d'élection de domicile si applicable",
    roles: ["tenant"],
    housingStatuses: ["unknown"],
    oneOfGroup: "tenant-domicile"
  },
  {
    id: "domicile-guarantor",
    category: "domicile",
    label: "Justificatif de domicile du garant",
    detail: "Dernière quittance, facture eau/gaz/électricité de moins de 3 mois, assurance logement, taxe foncière ou titre de propriété.",
    roles: ["guarantor"],
    oneOfGroup: "guarantor-domicile"
  },
  {
    id: "pro-contract",
    category: "professional",
    label: "Contrat de travail, de stage ou attestation employeur",
    roles: ["tenant", "guarantor"],
    workStatuses: ["cdi", "cdd", "apprentice"]
  },
  {
    id: "pro-student",
    category: "professional",
    label: "Carte étudiante ou certificat de scolarité",
    roles: ["tenant"],
    workStatuses: ["student", "apprentice"]
  },
  {
    id: "pro-company",
    category: "professional",
    label: "Justificatif récent d'activité professionnelle",
    detail: "Extrait K/Kbis, immatriculation RNE, certificat INSEE, carte professionnelle ou pièce récente équivalente autorisée.",
    roles: ["tenant", "guarantor"],
    workStatuses: ["self-employed", "micro-entrepreneur", "other"]
  },
  {
    id: "resources-pay-slips",
    category: "resources",
    label: "Trois derniers bulletins de salaire si disponibles",
    roles: ["tenant", "guarantor"],
    workStatuses: ["cdi", "cdd", "civil-servant", "apprentice"]
  },
  {
    id: "resources-tax",
    category: "resources",
    label: "Dernier ou avant-dernier avis d'imposition ou de non-imposition",
    roles: ["tenant", "guarantor"],
    workStatuses: ["cdi", "cdd", "civil-servant", "self-employed", "micro-entrepreneur", "retired", "student", "apprentice", "job-seeker", "social-benefits", "other"]
  },
  {
    id: "resources-independent",
    category: "resources",
    label: "Deux derniers bilans ou attestation comptable autorisée",
    roles: ["tenant", "guarantor"],
    workStatuses: ["self-employed", "micro-entrepreneur"]
  },
  {
    id: "resources-pension-benefits",
    category: "resources",
    label: "Attestation de retraite, France Travail, RSA ou prestations",
    roles: ["tenant", "guarantor"],
    workStatuses: ["retired", "job-seeker", "social-benefits", "rsa"]
  },
  {
    id: "resources-pension-benefits-last-three",
    category: "resources",
    label: "Trois dernières attestations de paiement",
    roles: ["tenant", "guarantor"],
    workStatuses: ["retired", "job-seeker", "social-benefits", "rsa"]
  },
  {
    id: "resources-student-grant",
    category: "resources",
    label: "Avis d'attribution de bourse si étudiant boursier",
    roles: ["tenant"],
    workStatuses: ["student", "apprentice"]
  }
];

export function getDocumentRules(role: ApplicantRole, workStatus: WorkStatus, housingStatus: HousingStatus) {
  return rentalDocumentRules.filter((rule) => {
    if (!rule.roles.includes(role)) return false;
    if (rule.workStatuses && !rule.workStatuses.includes(workStatus)) return false;
    if (rule.housingStatuses && !rule.housingStatuses.includes(housingStatus)) return false;
    return true;
  });
}

export const workStatusLabels: Record<WorkStatus, string> = {
  cdi: "Salarié CDI",
  cdd: "Salarié CDD",
  "civil-servant": "Fonctionnaire",
  "self-employed": "Indépendant / profession libérale",
  "micro-entrepreneur": "Auto-entrepreneur",
  retired: "Retraité",
  student: "Étudiant",
  apprentice: "Étudiant alternant / apprenti",
  "job-seeker": "Demandeur d'emploi",
  "social-benefits": "Bénéficiaire d'aides sociales",
  rsa: "RSA",
  other: "Autre"
};

export const housingStatusLabels: Record<HousingStatus, string> = {
  tenant: "Locataire",
  owner: "Propriétaire",
  hosted: "Hébergé",
  unknown: "Autre / je ne sais pas"
};
