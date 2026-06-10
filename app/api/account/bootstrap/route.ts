import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/auth-server";
import { readJsonBody, sanitizeText } from "@/lib/security";

export async function POST(request: NextRequest) {
  const context = await requireAuthContext(request);
  if (!context) {
    return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  }

  const { data, response } = await readJsonBody<{ agencyName?: string; firstName?: string; lastName?: string }>(request);
  if (response) return response;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configure." }, { status: 503 });
  }

  const agencyName = sanitizeText(data?.agencyName ?? "Nouvelle agence", 120) || "Nouvelle agence";
  const firstName = sanitizeText(data?.firstName ?? "", 80);
  const lastName = sanitizeText(data?.lastName ?? "", 80);

  const { data: existingProfile } = await supabase.from("profiles").select("id, organization_id").eq("id", context.userId).maybeSingle();
  if (existingProfile?.organization_id) {
    return NextResponse.json({ ok: true, alreadyBootstrapped: true });
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .insert({
      name: agencyName,
      extra_seat_price_eur: 99
    })
    .select("id, name, address, legal_name, legal_email, signature, logo_url, included_seats, extra_seat_price_eur")
    .single();

  if (organizationError || !organization) {
    return NextResponse.json({ error: organizationError?.message ?? "Impossible de creer l'organisation." }, { status: 500 });
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: context.userId,
    organization_id: organization.id,
    first_name: firstName,
    last_name: lastName,
    email: context.email
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await supabase.from("organization_members").insert({
    organization_id: organization.id,
    profile_id: context.userId,
    display_name: `${firstName} ${lastName}`.trim() || context.email,
    role: "owner"
  });

  const defaultSubscriptions = ["eligia", "studio"].map((moduleKey) => ({
    organization_id: organization.id,
    module_key: moduleKey,
    status: "inactive"
  }));

  await supabase.from("organization_subscriptions").upsert(defaultSubscriptions, { onConflict: "organization_id,module_key" });

  return NextResponse.json({ ok: true, organization });
}
