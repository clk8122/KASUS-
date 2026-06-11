import { NextRequest, NextResponse } from "next/server";

export const maxUploadFiles = 20;
export const maxUploadBytes = 12 * 1024 * 1024;
export const maxTotalUploadBytes = 48 * 1024 * 1024;

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJsonBody<T>(request: NextRequest): Promise<{ data: T | null; response?: NextResponse }> {
  try {
    return { data: await request.json() as T };
  } catch {
    return { data: null, response: jsonError("Corps JSON invalide.", 400) };
  }
}

export function sanitizeText(value: unknown, maxLength = 500) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function sanitizePositiveNumber(value: unknown, max = 1_000_000) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(max, number));
}

export function validateUploadFiles(files: File[], options?: { maxFiles?: number; maxFileBytes?: number; maxTotalBytes?: number }) {
  const maxFiles = options?.maxFiles ?? maxUploadFiles;
  const maxFileBytes = options?.maxFileBytes ?? maxUploadBytes;
  const maxTotalBytes = options?.maxTotalBytes ?? maxTotalUploadBytes;
  if (files.length > maxFiles) {
    return `Trop de fichiers transmis. Maximum autorise: ${maxFiles}.`;
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > maxTotalBytes) {
    return `Dossier trop volumineux. Maximum autorise: ${Math.round(maxTotalBytes / 1024 / 1024)} Mo.`;
  }
  const oversized = files.find((file) => file.size > maxFileBytes);
  if (oversized) {
    return `Le fichier ${oversized.name} depasse ${Math.round(maxFileBytes / 1024 / 1024)} Mo.`;
  }
  return "";
}

export function getPublicBaseUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.hostname === "localhost") return url.origin;
    } catch {
      return request.nextUrl.origin;
    }
  }
  return request.nextUrl.origin;
}

export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const allowed = getPublicBaseUrl(request);
  return origin === allowed ? null : jsonError("Origine non autorisee.", 403);
}

export function requireBearerToken(request: NextRequest, expected: string | undefined) {
  if (!expected) return jsonError("Token serveur non configure.", 503);
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  return token && token === expected ? null : jsonError("Acces refuse.", 401);
}
