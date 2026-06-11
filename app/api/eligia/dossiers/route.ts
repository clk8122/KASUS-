import { NextRequest, NextResponse } from "next/server";
import { RentalDossier, buildLocalAnalysis } from "@/lib/rental-flow";
import { requireEligiaAccess } from "@/lib/eligia-access";
import { jsonError, readJsonBody, sanitizePositiveNumber, sanitizeText } from "@/lib/security";

export async function GET(request: NextRequest) {
  const result = await requireEligiaAccess(request, "GET /api/eligia/dossiers");
  if (!result.ok) return result.response;
  const { supabase, organizationId } = result.access;

  const { data, error } = await supabase
    .from("dossiers")
    .select("id, address, rent, status, completeness, solvency_score, solvency_label, summary, created_at, updated_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[eligia] GET /dossiers: lecture impossible.", error.message);
    return jsonError("Lecture des dossiers impossible. Réessayez dans un instant.", 500);
  }

  return NextResponse.json({ dossiers: data ?? [] });
}

export async function POST(request: NextRequest) {
  const result = await requireEligiaAccess(request, "POST /api/eligia/dossiers");
  if (!result.ok) return result.response;
  const { supabase, organizationId } = result.access;

  const { data: rawDossier, response } = await readJsonBody<RentalDossier>(request);
  if (response) return response;
  if (!rawDossier) return jsonError("Dossier invalide.", 400);

  const dossier: RentalDossier = {
    ...rawDossier,
    address: sanitizeText(rawDossier.address, 280),
    rent: sanitizePositiveNumber(rawDossier.rent, 100_000),
    applicants: Array.isArray(rawDossier.applicants) ? rawDossier.applicants.slice(0, 12) : []
  };
  if (!dossier.address) return jsonError("L'adresse du bien est requise.", 400);

  const analysis = buildLocalAnalysis(dossier);
  const documentsUploaded = dossier.applicants.reduce((sum, applicant) => sum + applicant.documents.length, 0);
  const documentsExpected = Math.max(1, dossier.applicants.length * 4);

  const { data: createdDossier, error } = await supabase
    .from("dossiers")
    .insert({
      organization_id: organizationId,
      address: dossier.address,
      rent: dossier.rent,
      status: "Analyse disponible",
      completeness: Math.min(100, Math.round((documentsUploaded / documentsExpected) * 100)),
      solvency_score: analysis.solvencyScore,
      solvency_label: analysis.solvencyLabel,
      summary: analysis.summary
    })
    .select("id")
    .single();

  if (error || !createdDossier) {
    console.error("[eligia] POST /dossiers: création impossible.", error?.message);
    return jsonError("Création du dossier impossible. Réessayez dans un instant.", 500);
  }

  if (dossier.applicants.length) {
    const { error: applicantsError } = await supabase.from("applicants").insert(
      dossier.applicants.map((applicant) => ({
        dossier_id: createdDossier.id,
        first_name: sanitizeText(applicant.firstName, 80),
        last_name: sanitizeText(applicant.lastName, 80),
        role: applicant.role,
        work_status: applicant.workStatus,
        housing_status: applicant.housingStatus,
        monthly_income: sanitizePositiveNumber(applicant.monthlyIncome, 1_000_000),
        tax_notice_income: sanitizePositiveNumber(applicant.taxNoticeIncome, 10_000_000)
      }))
    );
    if (applicantsError) {
      console.error("[eligia] POST /dossiers: enregistrement des personnes incomplet.", applicantsError.message);
    }
  }

  return NextResponse.json({
    id: createdDossier.id,
    mode: "supabase",
    analysis
  });
}
