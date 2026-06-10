import { NextRequest, NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getFreeModules } from "@/lib/entitlements";

export async function GET(request: NextRequest) {
  const context = await requireAuthContext(request);
  if (!context) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configure." }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, first_name, last_name, email, phone")
    .eq("id", context.userId)
    .maybeSingle();
  const freeModules = getFreeModules(profile?.email ?? context.email);

  if (!profile?.organization_id) {
    return NextResponse.json({
      authenticated: true,
      user: { id: context.userId, email: context.email },
      profile,
      organization: null,
      subscriptions: [],
      members: [],
      freeModules,
      hasSubscription: freeModules.length > 0
    });
  }

  const [organizationResponse, subscriptionsResponse, membersResponse] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, address, legal_name, legal_email, signature, logo_url, included_seats, extra_seat_price_eur")
      .eq("id", profile.organization_id)
      .maybeSingle(),
    supabase
      .from("organization_subscriptions")
      .select("module_key, status, current_period_end")
      .eq("organization_id", profile.organization_id),
    supabase
      .from("organization_members")
      .select("id, display_name, invited_email, role")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: true })
  ]);

  const subscriptions = subscriptionsResponse.data ?? [];
  return NextResponse.json({
    authenticated: true,
    user: { id: context.userId, email: context.email },
    profile,
    organization: organizationResponse.data ?? null,
    subscriptions,
    members: membersResponse.data ?? [],
    freeModules,
    hasSubscription: subscriptions.some((subscription) => subscription.status === "active") || freeModules.length > 0
  });
}
