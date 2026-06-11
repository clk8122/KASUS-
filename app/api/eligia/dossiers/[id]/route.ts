import { NextRequest, NextResponse } from "next/server";
import { requireEligiaAccess } from "@/lib/eligia-access";
import { resolveDossierRef } from "@/lib/eligia-mvp";
import { jsonError } from "@/lib/security";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Garde-fou : seuls les identifiants serveur (UUID) ont un sens ici.
  // Les dossiers locaux (`created-…`) vivent sur l'appareil et ne doivent
  // jamais atteindre la base, sinon Postgres renvoie une erreur de cast brute.
  const ref = resolveDossierRef(id);
  if (ref.kind === "local") {
    return jsonError("Ce dossier est enregistré sur l'appareil qui l'a créé, pas sur le serveur.", 404);
  }
  if (ref.kind === "invalid") {
    console.warn(`[eligia] GET /dossiers/[id]: identifiant rejeté - ${ref.reason}`);
    return jsonError("Identifiant de dossier invalide.", 400);
  }

  const result = await requireEligiaAccess(request, "GET /api/eligia/dossiers/[id]");
  if (!result.ok) return result.response;
  const { supabase, organizationId } = result.access;

  const [dossierResponse, applicantsResponse] = await Promise.all([
    supabase
      .from("dossiers")
      .select("id, address, rent, status, completeness, solvency_score, solvency_label, summary, created_at, updated_at")
      .eq("organization_id", organizationId)
      .eq("id", ref.id)
      .maybeSingle(),
    supabase
      .from("applicants")
      .select("id, first_name, last_name, role, work_status, housing_status, monthly_income, tax_notice_income, created_at")
      .eq("dossier_id", ref.id)
      .order("created_at", { ascending: true })
  ]);

  if (dossierResponse.error) {
    console.error("[eligia] GET /dossiers/[id]: lecture impossible.", dossierResponse.error.message);
    return jsonError("Lecture du dossier impossible. Réessayez dans un instant.", 500);
  }
  if (!dossierResponse.data) {
    return jsonError("Dossier introuvable.", 404);
  }

  const applicants = applicantsResponse.data ?? [];
  const applicantIds = applicants.map((applicant) => applicant.id);

  // Documents strictement limités au dossier demandé (via ses personnes),
  // jamais l'ensemble des documents de l'organisation.
  const documentsResponse = applicantIds.length
    ? await supabase
        .from("documents")
        .select("id, applicant_id, file_name, mime_type, size_bytes, storage_path, created_at")
        .eq("organization_id", organizationId)
        .in("applicant_id", applicantIds)
    : { data: [], error: null };

  if (documentsResponse.error) {
    console.error("[eligia] GET /dossiers/[id]: lecture des documents impossible.", documentsResponse.error.message);
  }

  return NextResponse.json({
    dossier: dossierResponse.data,
    applicants,
    documents: documentsResponse.data ?? []
  });
}
