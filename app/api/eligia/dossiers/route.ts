import { NextRequest, NextResponse } from "next/server";
import { RentalDossier, buildLocalAnalysis } from "@/lib/rental-flow";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { readJsonBody, requireBearerToken, sanitizePositiveNumber, sanitizeText } from "@/lib/security";

export async function POST(request: NextRequest) {
  const { data: rawDossier, response } = await readJsonBody<RentalDossier>(request);
  if (response) return response;
  if (!rawDossier) return NextResponse.json({ error: "Dossier invalide" }, { status: 400 });

  const dossier: RentalDossier = {
    ...rawDossier,
    address: sanitizeText(rawDossier.address, 280),
    rent: sanitizePositiveNumber(rawDossier.rent, 100_000),
    applicants: Array.isArray(rawDossier.applicants) ? rawDossier.applicants.slice(0, 12) : []
  };
  const analysis = buildLocalAnalysis(dossier);
  const supabase = getSupabaseAdmin();

  if (!supabase || process.env.ENABLE_SUPABASE_API_WRITES !== "true") {
    return NextResponse.json({
      id: `local-${Date.now()}`,
      mode: "local",
      analysis,
      warning: supabase ? "Ecriture Supabase desactivee tant que l'authentification serveur n'est pas branchee." : undefined
    });
  }

  const authError = requireBearerToken(request, process.env.KASUS_API_TOKEN);
  if (authError) return authError;

  const organizationId = request.headers.get("x-organization-id");
  if (!organizationId) {
    return NextResponse.json({ error: "Missing organization id" }, { status: 400 });
  }

  const { data: createdDossier, error } = await supabase
    .from("dossiers")
    .insert({
      organization_id: organizationId,
      address: dossier.address,
      rent: dossier.rent,
      status: "Pre-analyse disponible",
      completeness: Math.min(
        100,
        Math.round(
          (dossier.applicants.reduce((sum, applicant) => sum + applicant.documents.length, 0) /
            Math.max(1, dossier.applicants.length * 4)) *
            100
        )
      ),
      solvency_score: analysis.solvencyScore,
      solvency_label: analysis.solvencyLabel,
      summary: analysis.summary
    })
    .select("id")
    .single();

  if (error || !createdDossier) {
    return NextResponse.json({ error: error?.message ?? "Unable to create dossier" }, { status: 500 });
  }

  for (const applicant of dossier.applicants) {
    await supabase.from("applicants").insert({
      dossier_id: createdDossier.id,
      first_name: applicant.firstName,
      last_name: applicant.lastName,
      role: applicant.role,
      work_status: applicant.workStatus,
      housing_status: applicant.housingStatus,
      monthly_income: applicant.monthlyIncome,
      tax_notice_income: applicant.taxNoticeIncome
    });
  }

  return NextResponse.json({
    id: createdDossier.id,
    mode: "supabase",
    analysis
  });
}
