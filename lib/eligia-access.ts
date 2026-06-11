import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthContext, type AuthContext } from "@/lib/auth-server";
import { hasFreeEligiaAccess } from "@/lib/entitlements";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type EligiaAccess = {
  context: AuthContext;
  supabase: SupabaseClient;
  organizationId: string;
};

export type EligiaAccessResult =
  | { ok: true; access: EligiaAccess }
  | { ok: false; response: NextResponse };

function deny(route: string, status: number, message: string): EligiaAccessResult {
  console.warn(`[eligia-access] ${route}: refus ${status} - ${message}`);
  return { ok: false, response: NextResponse.json({ error: message }, { status }) };
}

/**
 * Point unique de contrôle d'accès aux routes ELIGIA.
 * Chaque cause d'échec produit un statut et un message distincts, au lieu
 * d'un 403 générique impossible à diagnostiquer.
 */
export async function requireEligiaAccess(request: NextRequest, route: string): Promise<EligiaAccessResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return deny(route, 503, "Service indisponible : la base de données n'est pas configurée.");
  }

  const context = await requireAuthContext(request);
  if (!context) {
    return deny(route, 401, "Connexion requise.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", context.userId)
    .maybeSingle();

  if (profileError) {
    return deny(route, 500, "Lecture du profil impossible.");
  }
  if (!profile?.organization_id) {
    return deny(route, 403, "Aucune organisation associée à ce compte.");
  }

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("organization_subscriptions")
    .select("module_key, status")
    .eq("organization_id", profile.organization_id)
    .eq("module_key", "eligia");

  if (subscriptionsError) {
    return deny(route, 500, "Vérification de l'abonnement impossible.");
  }

  const allowed =
    subscriptions?.some((subscription) => subscription.status === "active") || hasFreeEligiaAccess(context.email);
  if (!allowed) {
    return deny(route, 403, "Le module ELIGIA n'est pas actif pour cette organisation.");
  }

  return {
    ok: true,
    access: { context, supabase, organizationId: profile.organization_id }
  };
}
