const allowedUploadMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif"
];

const maxUploadSizeMb = 20;

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
