import { NextRequest, NextResponse } from "next/server";
import { RentalDossier, buildLocalAnalysis } from "@/lib/rental-flow";
import { requireAuthContext } from "@/lib/auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { readJsonBody, sanitizePositiveNumber, sanitizeText } from "@/lib/security";

async function getOrganizationAccess(request: NextRequest) {
  const context = await requireAuthContext(request);
  if (!context) return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", context.userId).maybeSingle();
  if (!profile?.organization_id) return null;

  const { data: subscriptions } = await supabase
    .from("organization_subscriptions")
    .select("module_key, status")
    .eq("organization_id", profile.organization_id)
    .eq("module_key", "eligia");

  const allowed = subscriptions?.some((subscription) => subscription.status === "active");
  if (!allowed) return null;

  return { context, supabase, organizationId: profile.organization_id };
}

export async function GET(request: NextRequest) {
  const access = await getOrganizationAccess(request);
  if (!access) {
    return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  }

  const { data, error } = await access.supabase
    .from("dossiers")
    .select("id, address, rent, status, completeness, solvency_score, solvency_label, summary, created_at, updated_at")
    .eq("organization_id", access.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ dossiers: data ?? [] });
}

export async function POST(request: NextRequest) {
  const access = await getOrganizationAccess(request);
  if (!access) {
    return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  }

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

  const { data: createdDossier, error } = await access.supabase
    .from("dossiers")
    .insert({
      organization_id: access.organizationId,
      address: dossier.address,
      rent: dossier.rent,
      status: "Analyse disponible",
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
    await access.supabase.from("applicants").insert({
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
