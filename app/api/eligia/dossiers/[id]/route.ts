import { NextRequest, NextResponse } from "next/server";
import { hasFreeEligiaAccess } from "@/lib/entitlements";
import { requireAuthContext } from "@/lib/auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

async function getEligibleSupabase(request: NextRequest) {
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

  if (!subscriptions?.some((subscription) => subscription.status === "active") && !hasFreeEligiaAccess(context.email)) {
    return null;
  }

  return { supabase, organizationId: profile.organization_id };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await getEligibleSupabase(request);
  if (!access) {
    return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  }

  const { id } = await params;
  const [dossierResponse, applicantsResponse, documentsResponse] = await Promise.all([
    access.supabase
      .from("dossiers")
      .select("id, address, rent, status, completeness, solvency_score, solvency_label, summary, created_at, updated_at")
      .eq("organization_id", access.organizationId)
      .eq("id", id)
      .maybeSingle(),
    access.supabase
      .from("applicants")
      .select("id, first_name, last_name, role, work_status, housing_status, monthly_income, tax_notice_income, created_at")
      .eq("dossier_id", id)
      .order("created_at", { ascending: true }),
    access.supabase
      .from("documents")
      .select("id, applicant_id, file_name, mime_type, size_bytes, storage_path, created_at")
      .eq("organization_id", access.organizationId)
  ]);

  if (!dossierResponse.data) {
    return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  }

  const documents = (documentsResponse.data ?? []).filter((document) =>
    (applicantsResponse.data ?? []).some((applicant) => applicant.id === document.applicant_id)
  );

  return NextResponse.json({
    dossier: dossierResponse.data,
    applicants: applicantsResponse.data ?? [],
    documents
  });
}
