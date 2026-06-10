import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/auth-server";
import { readJsonBody, sanitizeText } from "@/lib/security";

type UpdatePayload = {
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  organization?: {
    name?: string;
    address?: string;
    legalName?: string;
    legalEmail?: string;
    signature?: string;
    logoDataUrl?: string;
  };
};

export async function PATCH(request: NextRequest) {
  const context = await requireAuthContext(request);
  if (!context) {
    return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  }

  const { data, response } = await readJsonBody<UpdatePayload>(request);
  if (response) return response;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configure." }, { status: 503 });
  }

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", context.userId).maybeSingle();
  if (!profile?.organization_id) {
    return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 });
  }

  if (data?.profile) {
    await supabase.from("profiles").update({
      first_name: sanitizeText(data.profile.firstName ?? "", 80),
      last_name: sanitizeText(data.profile.lastName ?? "", 80),
      phone: sanitizeText(data.profile.phone ?? "", 40)
    }).eq("id", context.userId);
  }

  if (data?.organization) {
    const logoUrl = sanitizeText(data.organization.logoDataUrl ?? "", 1_000_000);
    if (logoUrl && !logoUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Logo invalide." }, { status: 400 });
    }

    await supabase.from("organizations").update({
      name: sanitizeText(data.organization.name ?? "", 120),
      address: sanitizeText(data.organization.address ?? "", 180),
      legal_name: sanitizeText(data.organization.legalName ?? "", 120),
      legal_email: sanitizeText(data.organization.legalEmail ?? "", 120),
      signature: sanitizeText(data.organization.signature ?? "", 180),
      logo_url: logoUrl || undefined
    }).eq("id", profile.organization_id);
  }

  return NextResponse.json({ ok: true });
}
