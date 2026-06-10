import { allowedUploadMimeTypes, maxUploadSizeMb } from "./mock-data";

export type UploadValidation = {
  ok: boolean;
  message: string;
};

export function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export function validateUploadFile(file: File): UploadValidation {
  if (!allowedUploadMimeTypes.includes(file.type)) {
    return { ok: false, message: "Format non accepte. Utilisez PDF, JPG, PNG ou HEIC." };
  }

  if (file.size > maxUploadSizeMb * 1024 * 1024) {
    return { ok: false, message: `Fichier trop volumineux. Limite: ${maxUploadSizeMb} Mo.` };
  }

  return { ok: true, message: sanitizeFileName(file.name) };
}

export async function mockOrganizeRentalFile() {
  // TODO production: brancher OCR, conversion image vers PDF, classification documentaire,
  // stockage prive, RLS Supabase, generation ZIP/PDF et journalisation sans donnees sensibles.
  return {
    status: "Pre-analyse disponible",
    summary: "Pieces organisees en mode demonstration. Analyse humaine requise.",
    indicator: "Indicateur interne d'aide a la lecture, non decisionnel."
  };
}
