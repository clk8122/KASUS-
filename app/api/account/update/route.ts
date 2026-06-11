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

  // Mise à jour partielle stricte : seuls les champs explicitement fournis
  // sont écrits. Un champ absent ne doit jamais écraser une valeur existante.
  if (data?.profile) {
    const profileUpdates: Record<string, string> = {};
    if (data.profile.firstName !== undefined) profileUpdates.first_name = sanitizeText(data.profile.firstName, 80);
    if (data.profile.lastName !== undefined) profileUpdates.last_name = sanitizeText(data.profile.lastName, 80);
    if (data.profile.phone !== undefined) profileUpdates.phone = sanitizeText(data.profile.phone, 40);

    if (Object.keys(profileUpdates).length) {
      const { error } = await supabase.from("profiles").update(profileUpdates).eq("id", context.userId);
      if (error) {
        console.error("[account] PATCH /update: profil non enregistré.", error.message);
        return NextResponse.json({ error: "Mise à jour du profil impossible." }, { status: 500 });
      }
    }
  }

  if (data?.organization) {
    const organizationUpdates: Record<string, string> = {};
    if (data.organization.name !== undefined) organizationUpdates.name = sanitizeText(data.organization.name, 120);
    if (data.organization.address !== undefined) organizationUpdates.address = sanitizeText(data.organization.address, 180);
    if (data.organization.legalName !== undefined) organizationUpdates.legal_name = sanitizeText(data.organization.legalName, 120);
    if (data.organization.legalEmail !== undefined) organizationUpdates.legal_email = sanitizeText(data.organization.legalEmail, 120);
    if (data.organization.signature !== undefined) organizationUpdates.signature = sanitizeText(data.organization.signature, 180);

    if (data.organization.logoDataUrl !== undefined) {
      const logoUrl = sanitizeText(data.organization.logoDataUrl, 1_000_000);
      if (logoUrl && !logoUrl.startsWith("data:image/")) {
        return NextResponse.json({ error: "Logo invalide." }, { status: 400 });
      }
      if (logoUrl) organizationUpdates.logo_url = logoUrl;
    }

    if (Object.keys(organizationUpdates).length) {
      const { error } = await supabase.from("organizations").update(organizationUpdates).eq("id", profile.organization_id);
      if (error) {
        console.error("[account] PATCH /update: organisation non enregistrée.", error.message);
        return NextResponse.json({ error: "Mise à jour de l'organisation impossible." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
