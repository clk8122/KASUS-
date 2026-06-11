import { NextRequest, NextResponse } from "next/server";
import { EligiaAnalysisReport, EligiaMvpPerson, EligiaDocumentCheck, EligiaDocumentInventoryItem } from "@/lib/eligia-mvp";
import { jsonError, sanitizePositiveNumber, sanitizeText, validateUploadFiles } from "@/lib/security";

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);
const supportedFileTypes = new Set(["application/pdf"]);

type ResponseContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail?: "low" | "high" | "auto" }
  | { type: "input_file"; filename: string; file_data: string };

type DocumentAnalysisPayload = {
  people: EligiaMvpPerson[];
  report: EligiaAnalysisReport;
};

type InventoryPayload = {
  documents: EligiaDocumentInventoryItem[];
};

type StrictDocType =
  | "piece_identite"
  | "titre_sejour"
  | "passeport"
  | "contrat_travail"
  | "attestation_employeur"
  | "bulletin_salaire"
  | "attestation_salaire_annuelle"
  | "contrat_apprentissage"
  | "carte_etudiant"
  | "avis_bourse"
  | "avis_imposition"
  | "quittance_loyer"
  | "justificatif_domicile"
  | "taxe_fonciere"
  | "titre_propriete"
  | "attestation_hebergement"
  | "attestation_assurance_habitation"
  | "facture_energie"
  | "kbis"
  | "bilan_comptable"
  | "attestation_retraite"
  | "attestation_france_travail"
  | "attestation_rsa"
  | "releve_prestations"
  | "autre"
  | "illisible";

const documentSignatureGuide = [
  "MODELE DE DOSSIER ELIGIA: ne jamais valider une piece par son nom seul. Comparer le document aux marqueurs forts ci-dessous. Une piece est fiable si plusieurs marqueurs internes concordent et si aucun marqueur interdit n'apparait.",
  "avis_imposition: document DGFiP/impots.gouv. Marqueurs forts: avis d'impot ou avis d'imposition, numero fiscal, reference de l'avis, revenu fiscal de reference, nombre de parts, impot sur les revenus, date de mise en recouvrement. Interdit: attestation de salaire, certificat de salaire, net imposable de fiche de paie, cumul imposable.",
  "bulletin_salaire: employeur, SIRET ou code APE/NAF, salarie, periode de paie, emploi ou classification, salaire brut, cotisations, net a payer, net social/net imposable, mention de conservation du bulletin.",
  "contrat_travail: contrat de travail ou promesse/attestation employeur, identite employeur et salarie, poste, date d'embauche ou date d'effet, type CDI/CDD, remuneration, duree du travail, signatures. Interdit: simple bulletin de paie.",
  "contrat_apprentissage: contrat ecrit ou Cerfa 10103, employeur, apprenti, CFA/formation, diplome ou titre prepare, maitre d'apprentissage, salaire par annee, dates du contrat, signatures.",
  "carte_etudiant: carte ou certificat de scolarite, etablissement d'enseignement, nom/prenom de l'etudiant, annee universitaire, numero etudiant ou INE, formation.",
  "avis_bourse: notification ou avis d'attribution de bourse, CROUS ou organisme payeur, etudiant, annee universitaire, echelon ou montant.",
  "quittance_loyer: quittance ou recu de loyer emis par bailleur, locataire, adresse du logement, periode concernee, montant du loyer, charges, somme acquittee ou paiement recu. Interdit: bulletin de paie, salaire, net imposable.",
  "piece_identite/passeport/titre_sejour: document officiel d'identite avec nom, prenom, date de naissance, nationalite ou lieu de naissance, numero du titre, date de validite ou delivrance, autorite de delivrance.",
  "taxe_fonciere: avis de taxe fonciere ou taxes foncieres, DGFiP/impots.gouv, numero fiscal ou reference d'avis, proprietes baties/non baties, adresse du bien, montant a payer.",
  "titre_propriete: acte de propriete ou attestation notariale, notaire, proprietaire, adresse/designation du bien, date de l'acte, publication ou references cadastrales.",
  "attestation_hebergement: formule 'je soussigne', identite de l'hebergeur, identite de la personne hebergee, adresse du domicile, date de debut d'hebergement, date et signature.",
  "attestation_assurance_habitation: assurance habitation, assure, adresse du logement, assureur, numero de contrat, periode de validite, risques couverts.",
  "facture_energie: facture electricite/gaz/eau/telephone/internet, fournisseur, titulaire, adresse de consommation, periode, montant, date recente.",
  "kbis: extrait Kbis/RCS, SIREN/SIRET, denomination sociale, forme juridique, adresse du siege, activite, greffe, date d'immatriculation, dirigeant.",
  "bilan_comptable: bilan ou comptes annuels avec actif/passif, compte de resultat, exercice comptable, total bilan, chiffre d'affaires ou resultat, expert-comptable ou liasse fiscale.",
  "attestation_france_travail: France Travail ou Pole emploi, identifiant demandeur, allocation ou ARE, periode indemnisee, montant journalier ou mensuel.",
  "attestation_rsa: CAF/MSA, RSA, allocataire, numero allocataire, periode, montant verse.",
  "attestation_retraite: caisse de retraite, pension/retraite, beneficiaire, periode, montant mensuel ou annuel.",
  "releve_prestations: organisme payeur CAF/MSA/France Travail/caisse de retraite, beneficiaire, periode, nature de prestation, montant verse, date de paiement."
].join("\n");

const signatureRules: Partial<Record<StrictDocType, { requiredAny: string[]; forbiddenAny?: string[]; minHits: number }>> = {
  avis_imposition: {
    requiredAny: ["direction generale des finances publiques", "dgfip", "impots.gouv", "avis d impot", "avis d'imposition", "avis imposition", "impot sur les revenus", "numero fiscal", "reference de l avis", "reference de l'avis", "revenu fiscal de reference", "nombre de parts", "date de mise en recouvrement"],
    forbiddenAny: ["attestation de salaire", "certificat de salaire", "bulletin de salaire", "fiche de paie", "cumul imposable", "net imposable", "salaire annuel"],
    minHits: 3
  },
  bulletin_salaire: {
    requiredAny: ["bulletin de paie", "bulletin salaire", "fiche de paie", "periode de paie", "siret", "ape", "naf", "salaire brut", "net a payer", "montant net social", "cotisations", "conserver sans limitation de duree"],
    forbiddenAny: ["quittance de loyer", "avis d imposition", "revenu fiscal de reference"],
    minHits: 3
  },
  contrat_travail: {
    requiredAny: ["contrat de travail", "contrat a duree indeterminee", "contrat a duree determinee", "cdi", "cdd", "date d embauche", "date d'effet", "poste", "emploi", "remuneration", "duree du travail", "signature"],
    forbiddenAny: ["bulletin de paie", "net a payer", "cotisations salariales"],
    minHits: 3
  },
  attestation_employeur: {
    requiredAny: ["attestation employeur", "attestation de l employeur", "certifie employer", "poste", "date d embauche", "cdi", "cdd", "remuneration"],
    forbiddenAny: ["bulletin de paie", "quittance de loyer"],
    minHits: 2
  },
  contrat_apprentissage: {
    requiredAny: ["contrat d apprentissage", "contrat apprentissage", "cerfa 10103", "apprenti", "maitre d apprentissage", "cfa", "diplome prepare", "titre prepare", "salaire", "date de debut", "date de fin", "signature"],
    forbiddenAny: ["bulletin de paie", "avis d imposition"],
    minHits: 3
  },
  carte_etudiant: {
    requiredAny: ["carte etudiant", "certificat de scolarite", "etudiant", "annee universitaire", "universite", "ecole", "formation", "numero etudiant", "ine"],
    minHits: 3
  },
  avis_bourse: {
    requiredAny: ["notification de bourse", "avis d attribution de bourse", "bourse", "crous", "etudiant", "annee universitaire", "echelon", "montant"],
    minHits: 3
  },
  quittance_loyer: {
    requiredAny: ["quittance de loyer", "recu de loyer", "bailleur", "locataire", "loyer", "charges", "somme acquittee", "paiement recu", "periode du"],
    forbiddenAny: ["bulletin de paie", "fiche de paie", "salaire brut", "net a payer", "net imposable"],
    minHits: 3
  },
  piece_identite: {
    requiredAny: ["carte nationale d identite", "cni", "republique francaise", "nom", "prenom", "date de naissance", "lieu de naissance", "numero du document", "date d expiration"],
    minHits: 3
  },
  passeport: {
    requiredAny: ["passeport", "passport", "nom", "prenom", "nationalite", "date de naissance", "numero du passeport", "date d expiration"],
    minHits: 3
  },
  titre_sejour: {
    requiredAny: ["titre de sejour", "carte de sejour", "autorise son titulaire a travailler", "nationalite", "date d expiration", "numero etranger"],
    minHits: 2
  },
  taxe_fonciere: {
    requiredAny: ["taxe fonciere", "taxes foncieres", "dgfip", "impots.gouv", "numero fiscal", "reference de l avis", "proprietes baties", "montant a payer"],
    minHits: 3
  },
  titre_propriete: {
    requiredAny: ["acte de propriete", "titre de propriete", "attestation notariale", "notaire", "proprietaire", "designation du bien", "references cadastrales", "publication"],
    minHits: 3
  },
  attestation_hebergement: {
    requiredAny: ["je soussigne", "heberge", "a mon domicile", "attestation d hebergement", "personne hebergee", "adresse suivante", "date et signature"],
    minHits: 3
  },
  attestation_assurance_habitation: {
    requiredAny: ["attestation d assurance habitation", "assurance habitation", "assure", "assureur", "numero de contrat", "adresse du logement", "periode de validite", "risques couverts"],
    minHits: 3
  },
  facture_energie: {
    requiredAny: ["facture", "electricite", "gaz", "eau", "telephone", "internet", "titulaire", "adresse de consommation", "periode", "montant"],
    minHits: 3
  },
  kbis: {
    requiredAny: ["extrait kbis", "registre du commerce", "rcs", "siren", "siret", "greffe", "denomination", "forme juridique", "siege social"],
    minHits: 3
  },
  bilan_comptable: {
    requiredAny: ["bilan", "actif", "passif", "compte de resultat", "exercice", "total bilan", "chiffre d affaires", "resultat net"],
    minHits: 3
  },
  attestation_france_travail: {
    requiredAny: ["france travail", "pole emploi", "attestation", "allocation", "are", "identifiant demandeur", "periode indemnisee", "montant"],
    minHits: 3
  },
  attestation_rsa: {
    requiredAny: ["caf", "msa", "rsa", "revenu de solidarite active", "allocataire", "numero allocataire", "montant verse"],
    minHits: 3
  },
  attestation_retraite: {
    requiredAny: ["retraite", "pension", "caisse de retraite", "carsat", "agirc", "arrco", "montant", "periode"],
    minHits: 3
  },
  releve_prestations: {
    requiredAny: ["attestation de paiement", "releve de paiement", "organisme payeur", "beneficiaire", "periode", "montant verse", "date de paiement", "prestation"],
    minHits: 3
  }
};

function normalizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasAny(value: string, words: string[]) {
  return words.some((word) => value.includes(word));
}

function normalizeEvidence(value: EligiaDocumentCheck) {
  return normalizeFileName([
    value.label,
    value.documentType ?? "",
    value.evidenceReason ?? "",
    ...(value.evidence ?? [])
  ].join(" "));
}

function isDocType(value: EligiaDocumentCheck, accepted: StrictDocType[]) {
  return accepted.includes((value.documentType ?? "autre") as StrictDocType);
}

function evidenceHas(value: EligiaDocumentCheck, words: string[]) {
  return hasAny(normalizeEvidence(value), words);
}

function inventoryEvidence(item: EligiaDocumentInventoryItem) {
  return normalizeFileName([item.fileName, item.documentType, item.evidenceReason, ...(item.extractedFacts ?? [])].join(" "));
}

function validateDocumentSignature(item: EligiaDocumentInventoryItem): EligiaDocumentInventoryItem {
  const rule = signatureRules[item.documentType as StrictDocType];
  if (!rule) return item;
  const evidence = inventoryEvidence(item);
  const forbidden = rule.forbiddenAny?.filter((word) => evidence.includes(word)) ?? [];
  const hits = rule.requiredAny.filter((word) => evidence.includes(word));
  if (forbidden.length || hits.length < rule.minHits) {
    return {
      ...item,
      confidence: Math.min(item.confidence, 0.58),
      evidenceReason: `${item.evidenceReason} Validation documentaire insuffisante: ${hits.length}/${rule.minHits} marqueur(s) fort(s) detecte(s)${forbidden.length ? `; marqueurs incompatibles: ${forbidden.join(", ")}` : ""}.`,
      extractedFacts: Array.from(new Set([...(item.extractedFacts ?? []), ...hits.map((hit) => `marqueur:${hit}`), ...forbidden.map((hit) => `incompatible:${hit}`)]))
    };
  }
  return {
    ...item,
    confidence: Math.max(item.confidence, 0.76),
    evidenceReason: `${item.evidenceReason} Validation documentaire: ${hits.length} marqueur(s) fort(s) detecte(s).`,
    extractedFacts: Array.from(new Set([...(item.extractedFacts ?? []), ...hits.map((hit) => `marqueur:${hit}`)]))
  };
}

function deterministicDocumentType(fileName: string): EligiaDocumentInventoryItem {
  const normalized = normalizeFileName(fileName).replace(/[_-]+/g, " ");
  const salarySignals = ["bulletin", "fiche de paie", "paie", "net imposable", "cumul imposable", "salaire"];
  const annualSalarySignals = ["attestation salaire", "attestation de salaire", "salaire annuelle", "salaire annuel", "certificat de salaire"];
  const taxSignals = ["avis imposition", "avis d imposition", "avis impot", "dgfip", "impots gouv", "revenu fiscal reference", "revenu fiscal de reference"];
  let documentType: StrictDocType = "autre";
  let confidence = 0.55;
  let evidenceReason = "Classification prudente par nom de fichier.";

  if (hasAny(normalized, annualSalarySignals)) {
    documentType = "attestation_salaire_annuelle";
    confidence = 0.92;
    evidenceReason = "Le nom du fichier indique une attestation de salaire annuelle, pas un avis d'imposition.";
  } else if (hasAny(normalized, taxSignals) && !hasAny(normalized, salarySignals)) {
    documentType = "avis_imposition";
    confidence = 0.9;
    evidenceReason = "Le nom du fichier contient des signaux fiscaux DGFIP/avis d'imposition.";
  } else if (hasAny(normalized, ["piece identite", "identite", "cni", "carte identite", "passeport", "titre sejour"])) {
    documentType = hasAny(normalized, ["passeport"]) ? "passeport" : hasAny(normalized, ["sejour"]) ? "titre_sejour" : "piece_identite";
    confidence = 0.88;
    evidenceReason = "Le nom du fichier indique une pièce d'identité.";
  } else if (hasAny(normalized, ["contrat apprentissage", "contrat d apprentissage", "cerfa 10103", "apprenti", "alternance"])) {
    documentType = "contrat_apprentissage";
    confidence = 0.88;
    evidenceReason = "Le nom du fichier indique un contrat d'apprentissage ou d'alternance.";
  } else if (hasAny(normalized, ["carte etudiant", "certificat scolarite", "certificat de scolarite", "scolarite"])) {
    documentType = "carte_etudiant";
    confidence = 0.84;
    evidenceReason = "Le nom du fichier indique une carte etudiant ou un certificat de scolarite.";
  } else if (hasAny(normalized, ["bourse", "crous"])) {
    documentType = "avis_bourse";
    confidence = 0.82;
    evidenceReason = "Le nom du fichier indique une notification ou un avis de bourse.";
  } else if (hasAny(normalized, ["contrat travail", "contrat de travail", "attestation employeur", "promesse embauche", "cdi", "cdd"])) {
    documentType = hasAny(normalized, ["attestation employeur", "promesse embauche"]) ? "attestation_employeur" : "contrat_travail";
    confidence = 0.86;
    evidenceReason = "Le nom du fichier indique un contrat de travail ou une attestation employeur.";
  } else if (hasAny(normalized, ["bulletin salaire", "fiche paie", "fiche de paie", "paie"])) {
    documentType = "bulletin_salaire";
    confidence = 0.88;
    evidenceReason = "Le nom du fichier indique un bulletin ou une fiche de paie.";
  } else if (hasAny(normalized, ["quittance", "loyer", "bailleur"]) && !hasAny(normalized, salarySignals)) {
    documentType = "quittance_loyer";
    confidence = 0.84;
    evidenceReason = "Le nom du fichier indique une quittance ou un document de loyer.";
  } else if (hasAny(normalized, ["taxe fonciere", "fonciere"])) {
    documentType = "taxe_fonciere";
    confidence = 0.84;
    evidenceReason = "Le nom du fichier indique une taxe foncière.";
  } else if (hasAny(normalized, ["titre propriete", "titre de propriete", "acte propriete", "acte de propriete", "attestation notariale"])) {
    documentType = "titre_propriete";
    confidence = 0.84;
    evidenceReason = "Le nom du fichier indique un titre de propriete ou une attestation notariale.";
  } else if (hasAny(normalized, ["hebergement", "hebergeur"])) {
    documentType = "attestation_hebergement";
    confidence = 0.78;
    evidenceReason = "Le nom du fichier indique une attestation ou pièce d'hébergement.";
  } else if (hasAny(normalized, ["assurance habitation", "attestation assurance"])) {
    documentType = "attestation_assurance_habitation";
    confidence = 0.8;
    evidenceReason = "Le nom du fichier indique une attestation d'assurance habitation.";
  } else if (hasAny(normalized, ["facture electricite", "facture gaz", "facture eau", "facture telephone", "facture internet", "edf", "engie", "orange", "sfr"])) {
    documentType = "facture_energie";
    confidence = 0.8;
    evidenceReason = "Le nom du fichier indique une facture de domicile.";
  } else if (hasAny(normalized, ["kbis", "rne", "insee"])) {
    documentType = "kbis";
    confidence = 0.82;
    evidenceReason = "Le nom du fichier indique un justificatif d'entreprise.";
  } else if (hasAny(normalized, ["bilan", "comptable"])) {
    documentType = "bilan_comptable";
    confidence = 0.82;
    evidenceReason = "Le nom du fichier indique un bilan ou document comptable.";
  } else if (hasAny(normalized, ["france travail", "pole emploi", "attestation paiement chomage", "are"])) {
    documentType = "attestation_france_travail";
    confidence = 0.82;
    evidenceReason = "Le nom du fichier indique une attestation France Travail.";
  } else if (hasAny(normalized, ["rsa", "caf", "msa"])) {
    documentType = "attestation_rsa";
    confidence = 0.82;
    evidenceReason = "Le nom du fichier indique une attestation RSA ou CAF/MSA.";
  } else if (hasAny(normalized, ["retraite", "pension", "carsat", "agirc", "arrco"])) {
    documentType = "attestation_retraite";
    confidence = 0.82;
    evidenceReason = "Le nom du fichier indique une attestation ou releve de retraite.";
  } else if (hasAny(normalized, ["attestation paiement", "releve paiement", "releve de paiement", "prestations"])) {
    documentType = "releve_prestations";
    confidence = 0.78;
    evidenceReason = "Le nom du fichier indique un releve ou une attestation de prestations.";
  }

  return {
    fileName,
    documentType,
    ownerName: fileName.split(/[_-]/)[0] ?? "",
    documentDate: "",
    confidence,
    evidenceReason,
    extractedFacts: [normalized]
  };
}

function mergeInventoryWithFileNames(files: File[], inventory: InventoryPayload | null | undefined): InventoryPayload {
  const aiByName = new Map((inventory?.documents ?? []).map((item) => [item.fileName, item]));
  return {
    documents: files.map((file) => {
      const deterministic = deterministicDocumentType(file.name);
      const ai = aiByName.get(file.name);
      if (!ai) return validateDocumentSignature(deterministic);
      const aiEvidence = inventoryEvidence(ai);
      const salaryAsTax = ai.documentType === "avis_imposition" && hasAny(aiEvidence, ["attestation salaire", "attestation de salaire", "cumul imposable", "net imposable", "bulletin", "fiche de paie"]);
      const salaryAsHousing = ["quittance_loyer", "justificatif_domicile"].includes(ai.documentType) && hasAny(aiEvidence, ["bulletin", "fiche de paie", "salaire"]);
      const selected = salaryAsTax || salaryAsHousing
        ? deterministic
        : deterministic.confidence >= 0.84 && deterministic.documentType !== "autre" && (ai.confidence < deterministic.confidence || ai.documentType === "autre")
          ? deterministic
          : ai;
      return validateDocumentSignature(selected);
    })
  };
}

function inventoryToChecklist(inventory: EligiaDocumentInventoryItem[], people: EligiaMvpPerson[]): EligiaDocumentCheck[] {
  const defaultPerson = people[0]?.name ?? inventory.find((item) => item.ownerName)?.ownerName ?? "Candidat";
  const filesByType = (accepted: StrictDocType[]) => inventory.filter((item) => accepted.includes(item.documentType as StrictDocType) && item.confidence >= 0.62);
  const paySlips = filesByType(["bulletin_salaire"]);
  const checks: EligiaDocumentCheck[] = [
    {
      id: "identity",
      label: "Piece d'identite",
      category: "Identite",
      personName: defaultPerson,
      status: filesByType(["piece_identite", "titre_sejour", "passeport"]).length ? "present" : "missing",
      documentType: filesByType(["piece_identite", "titre_sejour", "passeport"])[0]?.documentType ?? "autre",
      evidence: filesByType(["piece_identite", "titre_sejour", "passeport"]).map((item) => item.fileName),
      evidenceReason: filesByType(["piece_identite", "titre_sejour", "passeport"])[0]?.evidenceReason ?? "Aucune piece d'identite classee avec confiance suffisante."
    },
    {
      id: "work-contract",
      label: "Contrat de travail ou attestation employeur",
      category: "Professionnel",
      personName: defaultPerson,
      status: filesByType(["contrat_travail", "attestation_employeur", "contrat_apprentissage"]).length ? "present" : "missing",
      documentType: filesByType(["contrat_travail", "attestation_employeur", "contrat_apprentissage"])[0]?.documentType ?? "autre",
      evidence: filesByType(["contrat_travail", "attestation_employeur", "contrat_apprentissage"]).map((item) => item.fileName),
      evidenceReason: filesByType(["contrat_travail", "attestation_employeur", "contrat_apprentissage"])[0]?.evidenceReason ?? "Aucun contrat ou attestation employeur classe avec confiance suffisante."
    },
    {
      id: "pay-slips",
      label: "3 derniers bulletins de salaire",
      category: "Revenus",
      personName: defaultPerson,
      status: paySlips.length >= 3 ? "present" : "missing",
      documentType: paySlips.length ? "bulletin_salaire" : "autre",
      evidence: paySlips.map((item) => item.fileName),
      evidenceReason: paySlips.length >= 3 ? "Trois bulletins de salaire distincts classes." : `${paySlips.length}/3 bulletin(s) de salaire classe(s).`
    },
    {
      id: "tax-notice",
      label: "Dernier avis d'imposition",
      category: "Fiscalite",
      personName: defaultPerson,
      status: filesByType(["avis_imposition"]).length ? "present" : "missing",
      documentType: filesByType(["avis_imposition"])[0]?.documentType ?? "autre",
      evidence: filesByType(["avis_imposition"]).map((item) => item.fileName),
      evidenceReason: filesByType(["avis_imposition"])[0]?.evidenceReason ?? "Aucun avis d'imposition DGFIP classe avec confiance suffisante."
    },
    {
      id: "housing",
      label: "Justificatif de domicile ou quittances",
      category: "Domicile",
      personName: defaultPerson,
      status: filesByType(["quittance_loyer", "justificatif_domicile", "taxe_fonciere", "titre_propriete", "attestation_hebergement", "attestation_assurance_habitation", "facture_energie"]).length ? "present" : "missing",
      documentType: filesByType(["quittance_loyer", "justificatif_domicile", "taxe_fonciere", "titre_propriete", "attestation_hebergement", "attestation_assurance_habitation", "facture_energie"])[0]?.documentType ?? "autre",
      evidence: filesByType(["quittance_loyer", "justificatif_domicile", "taxe_fonciere", "titre_propriete", "attestation_hebergement", "attestation_assurance_habitation", "facture_energie"]).map((item) => item.fileName),
      evidenceReason: filesByType(["quittance_loyer", "justificatif_domicile", "taxe_fonciere", "titre_propriete", "attestation_hebergement", "attestation_assurance_habitation", "facture_energie"])[0]?.evidenceReason ?? "Aucun justificatif de domicile classe avec confiance suffisante."
    }
  ];

  return hardValidateChecklist(checks, people);
}

function hasValidTaxNoticeForPerson(inventory: EligiaDocumentInventoryItem[] | undefined, personName: string) {
  if (!inventory?.length) return false;
  const normalizedPerson = normalizeFileName(personName);
  return inventory.some((item) => {
    if (item.documentType !== "avis_imposition" || item.confidence < 0.72) return false;
    const owner = normalizeFileName(item.ownerName ?? "");
    const evidence = normalizeFileName([item.fileName, item.evidenceReason, ...(item.extractedFacts ?? [])].join(" "));
    const hasTaxSignals = hasAny(evidence, [
      "avis d imposition",
      "avis d'impot",
      "avis impot",
      "direction generale des finances publiques",
      "dgfip",
      "revenu fiscal de reference",
      "impot sur les revenus"
    ]);
    const hasForbiddenSalarySignals = hasAny(evidence, [
      "attestation de salaire",
      "certificat de salaire",
      "cumul imposable",
      "net imposable",
      "salaire annuel",
      "bulletin de salaire",
      "fiche de paie"
    ]);
    const ownerMatches = !owner || !normalizedPerson || owner.includes(normalizedPerson) || normalizedPerson.includes(owner);
    return ownerMatches && hasTaxSignals && !hasForbiddenSalarySignals;
  });
}

function sanitizePeopleTaxIncome(people: EligiaMvpPerson[], inventory: EligiaDocumentInventoryItem[] | undefined) {
  return people.map((person) => {
    if (hasValidTaxNoticeForPerson(inventory, person.name)) return person;
    return {
      ...person,
      taxNoticeIncome: 0,
      warnings: [
        ...(person.warnings ?? []),
        "Avis d'imposition non validé : les cumuls de fiche de paie et attestations de salaire annuel ne sont pas acceptés comme avis d'imposition."
      ]
    };
  });
}

function sanitizeReportTaxIncome(report: EligiaAnalysisReport, inventory: EligiaDocumentInventoryItem[] | undefined) {
  const hasAnyValidTaxNotice = inventory?.some((item) => hasValidTaxNoticeForPerson(inventory, item.ownerName ?? "")) ?? false;
  if (hasAnyValidTaxNotice) return report;
  const warning = "Aucun vrai avis d'imposition n'a été validé. Les attestations de salaire annuel, cumuls imposables et bulletins de paie ne sont pas repris comme revenu fiscal annuel.";
  return {
    ...report,
    humanSummary: `${report.humanSummary ?? report.executiveSummary} ${warning}`,
    solvencySummary: `${report.solvencySummary} ${warning}`,
    documentSummary: `${report.documentSummary} ${warning}`,
    recommendation: `${report.recommendation} Demander le dernier avis d'imposition avant de présenter une lecture fiscale du dossier.`,
    riskPoints: Array.from(new Set([...report.riskPoints, warning]))
  };
}

function hasTaxAmountEvidence(inventory: EligiaDocumentInventoryItem[] | undefined, personName: string) {
  if (!hasValidTaxNoticeForPerson(inventory, personName)) return false;
  return (inventory ?? []).some((item) => {
    if (item.documentType !== "avis_imposition" || item.confidence < 0.72) return false;
    const evidence = normalizeFileName([item.fileName, item.evidenceReason, ...(item.extractedFacts ?? [])].join(" "));
    const amounts = evidence.match(/\b\d{4,6}\b/g)?.map(Number).filter((value) => value > 1000 && (value < 1900 || value > 2100)) ?? [];
    return amounts.length > 0 && hasAny(evidence, ["revenu fiscal", "revenu imposable", "impot sur les revenus", "avis imposition", "avis d impot"]);
  });
}

function sanitizePeopleTaxIncomeStrict(people: EligiaMvpPerson[], inventory: EligiaDocumentInventoryItem[] | undefined) {
  return people.map((person) => {
    const hasTaxDoc = hasValidTaxNoticeForPerson(inventory, person.name);
    if (hasTaxAmountEvidence(inventory, person.name)) return person;
    return {
      ...person,
      taxNoticeIncome: 0,
      warnings: [
        ...(person.warnings ?? []),
        hasTaxDoc
          ? "Avis d'imposition présent, mais aucun revenu fiscal annuel lisible n'a été extrait."
          : "Avis d'imposition non validé : les cumuls de fiche de paie et attestations de salaire annuel ne sont pas acceptés comme avis d'imposition."
      ]
    };
  });
}

function sanitizeReportTaxIncomeStrict(report: EligiaAnalysisReport, inventory: EligiaDocumentInventoryItem[] | undefined) {
  const hasAnyValidTaxNotice = inventory?.some((item) => hasValidTaxNoticeForPerson(inventory, item.ownerName ?? "")) ?? false;
  if (hasAnyValidTaxNotice) return report;
  const warning = "Aucun vrai avis d'imposition n'a été validé. Les attestations de salaire annuel, cumuls imposables et bulletins de paie ne sont pas repris comme revenu fiscal annuel.";
  return {
    ...report,
    humanSummary: `${report.humanSummary ?? report.executiveSummary} ${warning}`,
    solvencySummary: `${report.solvencySummary} ${warning}`,
    documentSummary: `${report.documentSummary} ${warning}`,
    recommendation: `${report.recommendation} Demander le dernier avis d'imposition avant de présenter une lecture fiscale du dossier.`,
    riskPoints: Array.from(new Set([...report.riskPoints, warning]))
  };
}

const frenchMonthIndex: Record<string, number> = {
  janvier: 0,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11
};

function parseEvidenceDates(value: string) {
  const normalized = normalizeFileName(value);
  const dates: Date[] = [];
  for (const match of normalized.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2}|19\d{2})\b/g)) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const date = new Date(year, month, day);
    if (!Number.isNaN(date.getTime())) dates.push(date);
  }
  for (const match of normalized.matchAll(/\b(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(20\d{2}|19\d{2})\b/g)) {
    const month = frenchMonthIndex[match[1]];
    const year = Number(match[2]);
    const date = new Date(year, month, 1);
    if (!Number.isNaN(date.getTime())) dates.push(date);
  }
  return dates;
}

function hasCoherentWorkChronology(inventory: EligiaDocumentInventoryItem[] | undefined) {
  const contractDates = (inventory ?? [])
    .filter((item) => ["contrat_travail", "attestation_employeur"].includes(item.documentType))
    .flatMap((item) => parseEvidenceDates([item.fileName, item.evidenceReason, ...(item.extractedFacts ?? [])].join(" ")));
  const paySlipDates = (inventory ?? [])
    .filter((item) => item.documentType === "bulletin_salaire")
    .flatMap((item) => parseEvidenceDates([item.fileName, item.evidenceReason, ...(item.extractedFacts ?? [])].join(" ")));
  if (!contractDates.length || !paySlipDates.length) return false;
  const earliestContract = contractDates.reduce((min, date) => date < min ? date : min, contractDates[0]);
  const latestPaySlip = paySlipDates.reduce((max, date) => date > max ? date : max, paySlipDates[0]);
  return earliestContract <= latestPaySlip;
}

function removeFalseChronologyWarnings(payload: DocumentAnalysisPayload, inventory: EligiaDocumentInventoryItem[] | undefined): DocumentAnalysisPayload {
  if (!hasCoherentWorkChronology(inventory)) return payload;
  const falseDateRisk = (value: string) => {
    const normalized = normalizeFileName(value);
    const mentionsWorkDate = hasAny(normalized, ["date d'embauche", "date d embauche", "date de debut", "date debut"]);
    const claimsProblem = hasAny(normalized, ["future", "futur", "incoherence", "incoherent", "superieure", "apres cette date"]);
    return hasAny(normalized, ["incoherence de date", "incoherence temporelle", "date d embauche future", "date de debut superieure", "date debut superieure"]) || (mentionsWorkDate && claimsProblem);
  };
  return {
    people: payload.people.map((person) => ({
      ...person,
      warnings: (person.warnings ?? []).filter((warning) => !falseDateRisk(warning))
    })),
    report: {
      ...payload.report,
      riskPoints: payload.report.riskPoints.filter((risk) => !falseDateRisk(risk)),
      humanSummary: (payload.report.humanSummary ?? payload.report.executiveSummary ?? "")
        .replace(/\s*Le contrat de travail indique un début[^.]*incohérent[^.]*\./gi, "")
        .replace(/\s*Date d'embauche future[^.]*\./gi, "")
    }
  };
}

function scrubContradictorySentences(text: string | undefined, missingChecks: EligiaDocumentCheck[]) {
  const source = (text ?? "").trim();
  if (!source) return source;
  const missingText = normalizeFileName(missingChecks.map((item) => `${item.id} ${item.label} ${item.documentType}`).join(" "));
  const hasMissing = (words: string[]) => hasAny(missingText, words);
  const missingHousing = hasMissing(["housing", "domicile", "quittance", "loyer"]);
  const missingTax = hasMissing(["tax", "avis", "imposition", "fiscalite"]);
  const missingWork = hasMissing(["work", "contrat", "employeur"]);
  const missingIdentity = hasMissing(["identity", "identite"]);
  const missingPaySlips = hasMissing(["pay", "bulletin", "salaire"]);
  const sentences = source.split(/(?<=[.!?])\s+/).filter(Boolean);

  const kept = sentences.filter((sentence) => {
    const normalized = normalizeFileName(sentence);
    if (hasAny(normalized, ["complet"])) return false;
    if (hasAny(normalized, ["aucune incoherence", "pas d incoherence", "pas d'incoherence"])) return false;
    if (hasAny(normalized, ["dossier complet", "dossier est complet", "tous les documents attendus", "toutes les pieces attendues", "ensemble des documents attendus", "fourniture complete"])) return false;
    if (missingHousing && hasAny(normalized, ["quittance", "justificatif de domicile", "residence actuelle", "situation actuelle de locataire"])) return false;
    if (missingTax && hasAny(normalized, ["avis d imposition", "avis imposition", "revenu fiscal"]) && hasAny(normalized, ["fourni", "fournie", "present", "presente", "comprend"])) return false;
    if (missingWork && hasAny(normalized, ["contrat de travail", "contrat cdi", "contrat cdd", "attestation employeur"]) && hasAny(normalized, ["fourni", "fournie", "present", "presente", "comprend"])) return false;
    if (missingIdentity && hasAny(normalized, ["piece d identite", "identite", "cni", "passeport"]) && hasAny(normalized, ["fourni", "fournie", "present", "presente", "comprend"])) return false;
    if (missingPaySlips && hasAny(normalized, ["bulletin", "fiche de paie", "fiches de paie"]) && hasAny(normalized, ["trois", "3", "fourni", "fournie", "present", "presente", "comprend"])) return false;
    return true;
  });

  return kept.join(" ").trim();
}

function alignReportWithChecklist(report: EligiaAnalysisReport, checklist: EligiaDocumentCheck[]) {
  const missingChecks = checklist.filter((item) => item.status === "missing");
  const missingDocuments = missingChecks.map((item) => `${item.personName ? `${item.personName}: ` : ""}${item.label}`);
  if (!missingDocuments.length) return report;
  const correction = `Correction de contrôle : les pièces suivantes restent manquantes ou non conformes : ${missingDocuments.join(", ")}.`;
  const cleanHumanSummary = scrubContradictorySentences(report.humanSummary ?? report.executiveSummary, missingChecks);
  const cleanExecutiveSummary = scrubContradictorySentences(report.executiveSummary, missingChecks);
  const cleanRecommendation = scrubContradictorySentences(report.recommendation, missingChecks);
  const manyMissingSummary = missingDocuments.length >= 3
    ? `Le dossier est incomplet et ne permet pas encore une validation fiable. Les revenus visibles peuvent donner une première indication, mais les pièces obligatoires manquantes doivent être demandées avant de présenter le dossier.`
    : "";
  return {
    ...report,
    humanSummary: `${manyMissingSummary || cleanHumanSummary ? `${manyMissingSummary || cleanHumanSummary} ` : ""}${correction}`,
    executiveSummary: `${cleanExecutiveSummary ? `${cleanExecutiveSummary} ` : ""}${correction}`,
    documentSummary: `Pièces manquantes ou non validées : ${missingDocuments.join(", ")}.`,
    recommendation: `${cleanRecommendation ? `${cleanRecommendation} ` : ""}${correction}`,
    riskPoints: Array.from(new Set([...report.riskPoints, correction]))
  };
}

function hardValidateChecklist(checklist: EligiaDocumentCheck[], people: EligiaMvpPerson[]) {
  const defaultPerson = people[0]?.name ?? "Candidat";

  const normalized = checklist.map((item) => {
    const label = normalizeFileName(item.label);
    const next: EligiaDocumentCheck = {
      ...item,
      personName: item.personName || defaultPerson,
      evidence: item.evidence ?? [],
      evidenceReason: item.evidenceReason ?? "",
      documentType: item.documentType ?? "autre"
    };

    if (hasAny(label, ["avis", "imposition", "impot"])) {
      const valid = isDocType(next, ["avis_imposition"]) || evidenceHas(next, ["avis d imposition", "avis d'impot", "avis impot", "dgfip", "revenu fiscal de reference"]);
      const forbidden = isDocType(next, ["attestation_salaire_annuelle", "bulletin_salaire", "attestation_employeur", "contrat_travail"]) ||
        evidenceHas(next, ["attestation de salaire", "certificat de salaire", "bulletin", "fiche de paie", "salaire annuel"]);
      if (!valid || forbidden) {
        return {
          ...next,
          status: "missing" as const,
          evidence: [],
          evidenceReason: "Non valide: une attestation de salaire, un bulletin de paie ou un contrat ne remplace pas un avis d'imposition."
        };
      }
    }

    if (hasAny(label, ["quittance", "domicile", "loyer"])) {
      const valid = isDocType(next, ["quittance_loyer", "justificatif_domicile", "taxe_fonciere", "titre_propriete", "attestation_hebergement", "attestation_assurance_habitation", "facture_energie"]) ||
        evidenceHas(next, ["quittance", "appel de loyer", "recu de loyer", "bailleur", "taxe fonciere", "titre de propriete", "acte de propriete", "attestation notariale", "assurance habitation", "facture electricite", "facture gaz", "facture eau", "attestation hebergement"]);
      const forbidden = isDocType(next, ["bulletin_salaire", "attestation_salaire_annuelle", "contrat_travail", "attestation_employeur", "avis_imposition"]) ||
        evidenceHas(next, ["bulletin", "fiche de paie", "salaire", "contrat de travail", "avis d imposition"]);
      if (!valid || forbidden) {
        return {
          ...next,
          status: "missing" as const,
          evidence: [],
          evidenceReason: "Non valide: une fiche de paie, une attestation de salaire, un contrat ou un avis d'imposition ne prouve pas le domicile."
        };
      }
    }

    if (hasAny(label, ["bulletin", "fiche", "paie", "salaire"])) {
      const valid = isDocType(next, ["bulletin_salaire"]) || evidenceHas(next, ["bulletin de salaire", "fiche de paie", "net a payer"]);
      const forbidden = isDocType(next, ["attestation_salaire_annuelle"]) || evidenceHas(next, ["attestation de salaire", "certificat de salaire", "salaire annuel"]);
      if (!valid || forbidden) {
        return {
          ...next,
          status: "missing" as const,
          evidence: [],
          evidenceReason: "Non valide: une attestation annuelle de salaire ne remplace pas les 3 bulletins de salaire."
        };
      }
    }

    if (hasAny(label, ["contrat", "employeur", "travail"])) {
      const valid = isDocType(next, ["contrat_travail", "attestation_employeur"]) || evidenceHas(next, ["contrat de travail", "attestation employeur", "promesse d'embauche"]);
      const forbidden = isDocType(next, ["bulletin_salaire", "attestation_salaire_annuelle"]) || evidenceHas(next, ["bulletin de salaire", "fiche de paie", "attestation de salaire"]);
      if (!valid || forbidden) {
        return {
          ...next,
          status: "missing" as const,
          evidence: [],
          evidenceReason: "Non valide: un bulletin ou une attestation de salaire ne remplace pas le contrat de travail."
        };
      }
    }

    if (hasAny(label, ["identite", "passeport", "sejour"])) {
      const valid = isDocType(next, ["piece_identite", "titre_sejour", "passeport"]) || evidenceHas(next, ["carte nationale", "cni", "passeport", "titre de sejour", "permis de conduire"]);
      if (!valid) {
        return { ...next, status: "missing" as const, evidence: [], evidenceReason: "Piece d'identite non identifiee clairement." };
      }
    }

    return next;
  });

  const required = [
    { id: "identity", label: "Piece d'identite", category: "Identite" as const },
    { id: "work-contract", label: "Contrat de travail ou attestation employeur", category: "Professionnel" as const },
    { id: "pay-slips", label: "3 derniers bulletins de salaire", category: "Revenus" as const },
    { id: "tax-notice", label: "Dernier avis d'imposition", category: "Fiscalite" as const },
    { id: "housing", label: "Justificatif de domicile ou quittances", category: "Domicile" as const }
  ];

  for (const requiredItem of required) {
    if (!normalized.some((item) => item.id === requiredItem.id || normalizeFileName(item.label) === normalizeFileName(requiredItem.label))) {
      normalized.push({
        ...requiredItem,
        personName: defaultPerson,
        status: "missing",
        documentType: "autre",
        evidence: [],
        evidenceReason: "Piece obligatoire absente de la checklist IA."
      });
    }
  }

  return normalized;
}

function syncReportWithChecklist(report: EligiaAnalysisReport, checklist: EligiaDocumentCheck[]) {
  const missingDocuments = checklist
    .filter((item) => item.status === "missing")
    .map((item) => `${item.personName ? `${item.personName}: ` : ""}${item.label}`);
  const presentCount = checklist.filter((item) => item.status === "present").length;
  const completeness = checklist.length ? Math.round((presentCount / checklist.length) * 100) : report.completeness;

  const taxNoticeMissing = checklist.some((item) => item.id === "tax-notice" && item.status === "missing");

  return {
    ...report,
    completeness,
    documentChecklist: checklist,
    missingDocuments,
    documentSummary: missingDocuments.length
      ? `Pieces manquantes ou non validees: ${missingDocuments.join(", ")}.`
      : "Toutes les pieces obligatoires de la checklist sont presentes.",
    riskPoints: [
      ...report.riskPoints.filter((point) => !/garant/i.test(point)),
      ...(missingDocuments.length ? ["Des pieces obligatoires sont manquantes ou mal classees."] : []),
      ...(taxNoticeMissing ? ["Avis d'imposition absent ou non conforme : ne pas utiliser les cumuls de paie comme revenu fiscal annuel."] : [])
    ]
  };
}

function fallbackPeople(files: File[]): EligiaMvpPerson[] {
  const candidateDocs = files.map((file) => file.name);
  const joined = normalizeFileName(candidateDocs.join(" "));
  const guessedName = candidateDocs
    .map((name) => name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " "))
    .find((name) => name.trim().split(/\s+/).length >= 2);

  return [
    {
      id: "person-local-tenant",
      name: guessedName?.trim() || "Candidat a identifier",
      role: "Locataire",
      documents: candidateDocs,
      situation: hasAny(joined, ["cdi", "contrat", "salaire", "bulletin"]) ? "Situation salariee probable" : "Situation a confirmer",
      employer: "",
      housingStatus: hasAny(joined, ["quittance", "loyer"]) ? "Locataire actuel probable" : "",
      monthlyIncome: 0,
      taxNoticeIncome: 0,
      warnings: ["Extraction locale limitee: verification humaine necessaire."]
    }
  ];
}

function buildChecklist(files: File[], people: EligiaMvpPerson[]): EligiaDocumentCheck[] {
  const evidence = (words: string[]) => files.filter((file) => hasAny(normalizeFileName(file.name), words)).map((file) => file.name);
  const checks = [
    {
      id: "identity",
      label: "Piece d'identite",
      category: "Identite" as const,
      evidence: evidence(["identite", "passeport", "sejour", "cni", "carte"]),
    },
    {
      id: "work-contract",
      label: "Contrat de travail ou attestation employeur",
      category: "Professionnel" as const,
      evidence: evidence(["contrat", "travail", "employeur"]),
    },
    {
      id: "pay-slips",
      label: "3 derniers bulletins de salaire",
      category: "Revenus" as const,
      evidence: evidence(["bulletin", "paie", "fiche"]),
    },
    {
      id: "tax-notice",
      label: "Dernier avis d'imposition",
      category: "Fiscalite" as const,
      evidence: evidence(["impot", "imposition", "dgfip", "revenu-fiscal", "revenu fiscal"]),
    },
    {
      id: "housing",
      label: "Justificatif de domicile ou quittances",
      category: "Domicile" as const,
      evidence: evidence(["domicile", "quittance", "loyer", "edf", "facture", "hebergement", "fonciere"]),
    }
  ];

  return hardValidateChecklist(checks.map((check) => ({
    ...check,
    personName: people[0]?.name,
    documentType: check.id === "identity"
      ? "piece_identite"
      : check.id === "work-contract"
        ? "contrat_travail"
        : check.id === "pay-slips"
          ? "bulletin_salaire"
          : check.id === "tax-notice"
            ? "avis_imposition"
            : "quittance_loyer",
    evidenceReason: check.evidence.length ? "Classification locale par nom de fichier." : "",
    status: check.evidence.length ? "present" as const : "missing" as const
  })), people);
}

function buildFallbackReport(address: string, rent: number, files: File[], people: EligiaMvpPerson[]): EligiaAnalysisReport {
  const documentChecklist = hardValidateChecklist(buildChecklist(files, people), people);
  const missingDocuments = documentChecklist.filter((item) => item.status === "missing").map((item) => `${item.personName ? `${item.personName}: ` : ""}${item.label}`);

  const completeness = Math.max(15, Math.min(92, Math.round(((5 - missingDocuments.length) / 5) * 100)));
  const score = Math.max(20, Math.min(86, completeness - (rent > 0 ? 0 : 12)));
  const label = score >= 75 ? "Dossier solide a verifier" : score >= 55 ? "Dossier incomplet mais exploitable" : "Dossier fragile ou trop incomplet";
  const fileCount = files.length;

  return {
    score,
    label,
    completeness,
    humanSummary: `Le dossier concerne ${people[0]?.name ?? "un candidat"} pour le logement ${address || "adresse non renseignee"}. ${fileCount} piece(s) ont ete deposees. Les montants et l'employeur doivent etre confirmes par lecture IA ou controle humain.`,
    ownerMessage: `Bonjour, le dossier recu pour ${address || "le logement"} est en cours de verification. Les pieces transmises permettent une premiere lecture, mais ${missingDocuments.length ? `il manque encore: ${missingDocuments.join(", ")}.` : "les pieces principales semblent presentes."}`,
    executiveSummary: `Dossier pour ${address || "adresse non renseignee"} avec un loyer de ${rent || 0} EUR. ${fileCount} piece(s) ont ete recues.`,
    solvencySummary: "Les revenus exacts, le poste, l'employeur et la coherence avec le loyer doivent etre confirmes sur les bulletins, le contrat et l'avis d'imposition.",
    documentSummary: missingDocuments.length
      ? `Pieces manquantes ou non detectees dans les noms de fichiers: ${missingDocuments.join(", ")}.`
      : "Les principales familles de pieces semblent presentes d'apres les noms de fichiers.",
    documentChecklist,
    missingDocuments,
    inconsistencies: fileCount ? [] : ["Aucune piece transmise."],
    strengths: [
      fileCount >= 5 ? "Volume de pieces suffisant pour une premiere lecture." : "Dossier deja initialise.",
      people.length ? "Au moins une personne rattachee au dossier." : "Personnes a confirmer."
    ],
    riskPoints: [
      "Extraction locale non probante sur les montants.",
      "Controle humain requis avant toute decision locative."
    ],
    recommendation: missingDocuments.length
      ? "Demander les pieces manquantes puis relancer l'analyse avant presentation du dossier."
      : "Relire les montants, dates et identites, puis transmettre au gestionnaire pour decision.",
    source: "local"
  };
}

async function fileToContent(file: File): Promise<ResponseContent[]> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");

  if (supportedImageTypes.has(file.type)) {
    return [{ type: "input_image", image_url: `data:${file.type};base64,${base64}`, detail: "high" }];
  }

  if (supportedFileTypes.has(file.type)) {
    return [{ type: "input_file", filename: file.name, file_data: `data:${file.type};base64,${base64}` }];
  }

  if (file.type.startsWith("text/")) {
    const text = bytes.toString("utf8").slice(0, 12000);
    return [{ type: "input_text", text: `Nom du fichier: ${file.name}\nContenu extrait:\n${text}` }];
  }

  return [{ type: "input_text", text: `Fichier non lisible directement: ${file.name}. Utiliser le nom comme indice faible.` }];
}

function extractOutputText(payload: {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
}) {
  return payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).map((content) => content.text ?? "").join("") ?? "";
}

async function readDocumentInventory(files: File[], fileContents: ResponseContent[]) {
  const fileList = files.map((file, index) => `${index + 1}. ${file.name}`).join("\n");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Tu es un lecteur de pieces locatives. Ta seule mission est d'identifier le type exact de chaque fichier. Tu ne dois jamais combler une piece par approximation. Si un document est ambigu, classe-le autre ou illisible avec une confiance basse."
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                `Fichiers a classifier:\n${fileList}\n\n` +
                `Grille documentaire officielle a appliquer strictement:\n${documentSignatureGuide}\n\n` +
                "Classe chaque fichier uniquement avec les marqueurs visibles dans le document. Regles strictes: une attestation annuelle de salaire n'est jamais un avis d'imposition, meme si elle contient un salaire net imposable annuel; un cumul imposable ou net imposable sur fiche de paie n'est jamais un avis d'imposition; une fiche de paie n'est pas une quittance; un avis d'imposition doit venir de l'administration fiscale, DGFIP/impots.gouv, et mentionner des references fiscales fortes comme numero fiscal, reference de l'avis, revenu fiscal de reference, nombre de parts ou impot sur les revenus; une quittance doit venir d'un bailleur et parler du loyer paye; un contrat de travail doit etre un contrat ou une attestation employeur, pas un bulletin. Si les marqueurs forts manquent, classe autre ou illisible avec confiance basse. Dans extractedFacts, recopie seulement les marqueurs vus, pas des suppositions."
            },
            ...fileContents
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "eligia_document_inventory",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              documents: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    fileName: { type: "string" },
                    documentType: {
                      type: "string",
                      enum: ["piece_identite", "titre_sejour", "passeport", "contrat_travail", "attestation_employeur", "bulletin_salaire", "attestation_salaire_annuelle", "contrat_apprentissage", "carte_etudiant", "avis_bourse", "avis_imposition", "quittance_loyer", "justificatif_domicile", "taxe_fonciere", "titre_propriete", "attestation_hebergement", "attestation_assurance_habitation", "facture_energie", "kbis", "bilan_comptable", "attestation_retraite", "attestation_france_travail", "attestation_rsa", "releve_prestations", "autre", "illisible"]
                    },
                    ownerName: { type: "string" },
                    documentDate: { type: "string" },
                    confidence: { type: "number" },
                    evidenceReason: { type: "string" },
                    extractedFacts: { type: "array", items: { type: "string" } }
                  },
                  required: ["fileName", "documentType", "ownerName", "documentDate", "confidence", "evidenceReason", "extractedFacts"]
                }
              }
            },
            required: ["documents"]
          }
        }
      }
    })
  });

  if (!response.ok) return null;
  const payload = await response.json();
  return JSON.parse(extractOutputText(payload)) as InventoryPayload;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const address = sanitizeText(formData.get("address"), 280);
  const rent = sanitizePositiveNumber(formData.get("rent"), 100_000);
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  const uploadError = validateUploadFiles(files);
  if (uploadError) return jsonError(uploadError, 413);
  const fallbackPeopleList = fallbackPeople(files);
  const fallback: DocumentAnalysisPayload = {
    people: fallbackPeopleList,
    report: buildFallbackReport(address, rent, files, fallbackPeopleList)
  };

  if (!files.length) {
    return NextResponse.json(fallback);
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(fallback);
  }

  try {
    const fileContents = (await Promise.all(files.slice(0, 20).map(fileToContent))).flat();
    const fileList = files.map((file, index) => `${index + 1}. ${file.name}`).join("\n");
    const inventory = mergeInventoryWithFileNames(files.slice(0, 20), await readDocumentInventory(files.slice(0, 20), fileContents));
    const inventoryText = inventory.documents.length
      ? inventory.documents.map((document) => `${document.fileName}: ${document.documentType} (${Math.round(document.confidence * 100)}%) - ${document.evidenceReason}`).join("\n")
      : "Inventaire indisponible.";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Tu analyses des dossiers de candidature locative francais pour une agence. Tu dois produire une lecture operationnelle, humaine et precise. Tu ne prends jamais la decision finale. Ne signale pas l'absence de garant comme un probleme si les revenus locataires suffisent ou si aucun garant n'a ete fourni."
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  `Adresse du bien: ${address}\nLoyer charges comprises: ${rent} EUR\nFichiers recus:\n${fileList}\n\n` +
                  `Inventaire prealable des pieces, a respecter strictement:\n${inventoryText}\n\n` +
                  `Grille documentaire stricte:\n${documentSignatureGuide}\n\n` +
                  "Analyse les pieces jointes. Identifie locataires et garants quand c'est visible. Extrais: employeur, poste, type de contrat, date de debut, salaire net mensuel, revenu fiscal annuel, situation logement actuelle. Fais un resume humain en phrases naturelles, comme un conseiller qui explique le dossier a une gestionnaire, sans style robotique et sans formules du type 'rapport revenu / loyer'. IMPORTANT: respecte l'inventaire controle. Interdictions strictes: une attestation de salaire annuelle N'EST PAS un avis d'imposition; un cumul imposable ou net imposable sur fiche de paie N'EST PAS un avis d'imposition; un bulletin de salaire ou une fiche de paie N'EST PAS une quittance de loyer; un bulletin de salaire N'EST PAS un contrat de travail; un avis d'imposition N'EST PAS un justificatif de domicile. Le champ taxNoticeIncome doit rester a 0 si aucun vrai avis d'imposition DGFIP/impots.gouv n'est present avec marqueurs forts. Ne copie jamais un cumul de bulletin de paie, un net fiscal de fiche de paie ou une attestation de salaire annuel dans taxNoticeIncome. Pour un salarie CDI/CDD il faut obligatoirement: piece d'identite, contrat de travail ou attestation employeur, 3 derniers bulletins de salaire, dernier avis d'imposition, justificatif domicile/quittances. Mets present uniquement si le documentType correspond exactement a la piece demandee et si la confiance de l'inventaire est suffisante. Sinon missing avec evidenceReason expliquant pourquoi."
              },
              ...fileContents
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "eligia_document_analysis",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                people: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      role: { type: "string", enum: ["Locataire", "Garant"] },
                      documents: { type: "array", items: { type: "string" } },
                      situation: { type: "string" },
                      employer: { type: "string" },
                      housingStatus: { type: "string" },
                      monthlyIncome: { type: "number" },
                      taxNoticeIncome: { type: "number" },
                      incomeRatio: { type: "number" },
                      warnings: { type: "array", items: { type: "string" } }
                    },
                    required: ["id", "name", "role", "documents", "situation", "employer", "housingStatus", "monthlyIncome", "taxNoticeIncome", "incomeRatio", "warnings"]
                  }
                },
                report: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    score: { type: "number" },
                    label: { type: "string" },
                    completeness: { type: "number" },
                    humanSummary: { type: "string" },
                    ownerMessage: { type: "string" },
                    executiveSummary: { type: "string" },
                    solvencySummary: { type: "string" },
                    documentSummary: { type: "string" },
                    documentChecklist: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          id: { type: "string" },
                          label: { type: "string" },
                          category: { type: "string", enum: ["Identite", "Revenus", "Domicile", "Professionnel", "Fiscalite", "Autre"] },
                          personName: { type: "string" },
                          status: { type: "string", enum: ["present", "missing"] },
                          documentType: {
                            type: "string",
                            enum: ["piece_identite", "titre_sejour", "passeport", "contrat_travail", "attestation_employeur", "bulletin_salaire", "attestation_salaire_annuelle", "contrat_apprentissage", "carte_etudiant", "avis_bourse", "avis_imposition", "quittance_loyer", "justificatif_domicile", "taxe_fonciere", "titre_propriete", "attestation_hebergement", "attestation_assurance_habitation", "facture_energie", "kbis", "bilan_comptable", "attestation_retraite", "attestation_france_travail", "attestation_rsa", "releve_prestations", "autre", "illisible"]
                          },
                          evidenceReason: { type: "string" },
                          evidence: { type: "array", items: { type: "string" } }
                        },
                        required: ["id", "label", "category", "personName", "status", "documentType", "evidenceReason", "evidence"]
                      }
                    },
                    missingDocuments: { type: "array", items: { type: "string" } },
                    inconsistencies: { type: "array", items: { type: "string" } },
                    strengths: { type: "array", items: { type: "string" } },
                    riskPoints: { type: "array", items: { type: "string" } },
                    recommendation: { type: "string" },
                    source: { type: "string", enum: ["openai", "local"] }
                  },
                  required: ["score", "label", "completeness", "humanSummary", "ownerMessage", "executiveSummary", "solvencySummary", "documentSummary", "documentChecklist", "missingDocuments", "inconsistencies", "strengths", "riskPoints", "recommendation", "source"]
                }
              },
              required: ["people", "report"]
            }
          }
        }
      })
    });

    if (!response.ok) {
      return NextResponse.json(fallback);
    }

    const payload = await response.json();
    const parsed = JSON.parse(extractOutputText(payload)) as DocumentAnalysisPayload;
    const inventoryChecklist = inventory.documents.length ? inventoryToChecklist(inventory.documents, parsed.people) : [];
    const checkedList = hardValidateChecklist(inventoryChecklist.length ? inventoryChecklist : parsed.report.documentChecklist ?? [], parsed.people);
    const checkedReport = sanitizeReportTaxIncomeStrict(
      alignReportWithChecklist(
        syncReportWithChecklist({ ...parsed.report, source: "openai", documentInventory: inventory.documents }, checkedList),
        checkedList
      ),
      inventory.documents
    );
    const sanitizedPeople = sanitizePeopleTaxIncomeStrict(parsed.people, inventory.documents);
    const finalPayload = removeFalseChronologyWarnings({
      people: sanitizedPeople.map((person, index) => ({
        ...person,
        id: person.id || `person-openai-${index}`
      })),
      report: checkedReport
    }, inventory.documents);
    return NextResponse.json(finalPayload);
  } catch {
    return NextResponse.json(fallback);
  }
}
