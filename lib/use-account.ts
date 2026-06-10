"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSeatSummary, type AccountState, defaultAccountState, type TeamMember } from "@/lib/account-store";
import { getSupabaseBrowser, hasBrowserSupabaseConfig } from "@/lib/supabase/browser";

type SessionResponse = {
  authenticated: boolean;
  hasSubscription?: boolean;
  freeModules?: ModuleKey[];
  organization?: {
    id: string;
    name: string;
    address: string;
    legal_name: string;
    legal_email: string;
    signature: string;
    logo_url: string;
    included_seats: number;
    extra_seat_price_eur: number;
  } | null;
  profile?: {
    id: string;
    organization_id: string | null;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null;
  subscriptions?: Array<{ module_key: string; status: string; current_period_end: string | null }>;
  members?: Array<{ id: string; display_name: string; invited_email: string | null; role: string }>;
};

type ModuleKey = "eligia" | "studio";

function getAuthHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

function mapRole(role: string): TeamMember["role"] {
  if (role === "owner") return "Administrateur";
  if (role === "admin") return "Administrateur";
  if (role === "readonly") return "Lecture seule";
  return "Collaborateur";
}

function buildAccount(remote: SessionResponse): AccountState {
  const organization = remote.organization ?? null;
  const profile = remote.profile ?? null;
  const members = remote.members ?? [];

  return {
    firstName: profile?.first_name ?? "",
    lastName: profile?.last_name ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    agencyName: organization?.name ?? "",
    agencyAddress: organization?.address ?? "",
    agencyLogo: organization?.logo_url ?? "",
    legalName: organization?.legal_name ?? "",
    legalEmail: organization?.legal_email ?? "",
    signature: organization?.signature ?? "",
    planName: remote.hasSubscription ? (remote.freeModules?.length ? "Accès offert" : "Actif") : "Sans abonnement",
    includedSeats: organization?.included_seats ?? 3,
    extraSeatPrice: organization?.extra_seat_price_eur ?? 99,
    team: members.map((member) => ({
      id: member.id,
      name: member.display_name || member.invited_email || "Membre",
      email: member.invited_email || profile?.email || "",
      role: mapRole(member.role)
    }))
  };
}

export function useAccount() {
  const browserConfig = hasBrowserSupabaseConfig();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [account, setAccount] = useState<AccountState>(defaultAccountState);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [activeModules, setActiveModules] = useState<ModuleKey[]>([]);
  const [loading, setLoading] = useState(browserConfig);
  const [sessionToken, setSessionToken] = useState("");

  const loadAccount = useCallback(async (token?: string) => {
    const accessToken = token || sessionToken;
    if (!accessToken) {
      setAuthenticated(false);
      setHasSubscription(false);
      setActiveModules([]);
      setAccount(defaultAccountState);
      setLoading(false);
      return;
    }

    const response = await fetch("/api/account/session", {
      headers: getAuthHeaders(accessToken)
    });
    const payload = (await response.json()) as SessionResponse;
    const nextAccount = buildAccount(payload);
    setAccount(nextAccount);
    setAuthenticated(Boolean(payload.authenticated));
    const paidModules = (payload.subscriptions ?? []).filter((subscription) => subscription.status === "active").map((subscription) => subscription.module_key as ModuleKey);
    const freeModules = (payload.freeModules ?? []) as ModuleKey[];
    const modules = Array.from(new Set([...paidModules, ...freeModules]));
    setActiveModules(modules);
    setHasSubscription(Boolean(payload.hasSubscription));
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const token = data.session?.access_token ?? "";
      setSessionToken(token);
      void loadAccount(token);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = session?.access_token ?? "";
      setSessionToken(token);
      void loadAccount(token);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [loadAccount, supabase]);

  async function refresh() {
    if (!supabase) {
      await loadAccount();
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? sessionToken;
    await loadAccount(token);
  }

  async function signIn(email: string, password: string) {
    if (!supabase) return { error: "Supabase non configure." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    await refresh();
    return { error: "" };
  }

  async function signUp(input: { email: string; password: string; agencyName: string; firstName?: string; lastName?: string }) {
    if (!supabase) return { error: "Supabase non configure." };
    const { data, error } = await supabase.auth.signUp({ email: input.email, password: input.password });
    if (error) return { error: error.message };

    const token = data.session?.access_token ?? "";
    if (token) {
      await fetch("/api/account/bootstrap", {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          agencyName: input.agencyName,
          firstName: input.firstName ?? "",
          lastName: input.lastName ?? ""
        })
      });
      await refresh();
    }

    return { error: "" };
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAccount(defaultAccountState);
    setAuthenticated(false);
    setHasSubscription(false);
    setActiveModules([]);
  }

  async function updateAccount(updates: Partial<AccountState>) {
    if (!sessionToken) return;
    await fetch("/api/account/update", {
      method: "PATCH",
      headers: getAuthHeaders(sessionToken),
      body: JSON.stringify({
        profile: {
          firstName: updates.firstName,
          lastName: updates.lastName,
          phone: updates.phone
        },
        organization: {
          name: updates.agencyName,
          address: updates.agencyAddress,
          legalName: updates.legalName,
          legalEmail: updates.legalEmail,
          signature: updates.signature
        }
      })
    });
    await refresh();
  }

  async function updateLogo(logoDataUrl: string) {
    if (!sessionToken) return;
    await fetch("/api/account/update", {
      method: "PATCH",
      headers: getAuthHeaders(sessionToken),
      body: JSON.stringify({
        organization: {
          logoDataUrl
        }
      })
    });
    await refresh();
    setAccount((current) => ({ ...current, agencyLogo: logoDataUrl }));
  }

  async function startCheckout(moduleKey: ModuleKey) {
    if (!sessionToken) return { error: "Connexion requise." };
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: getAuthHeaders(sessionToken),
      body: JSON.stringify({ moduleKey })
    });
    const payload = await response.json();
    if (payload.url) {
      window.location.href = payload.url;
    }
    return payload;
  }

  function hasAccessTo(moduleKey: ModuleKey) {
    return activeModules.includes(moduleKey);
  }

  const seatSummary = useMemo(() => getSeatSummary(account), [account]);

  function addTeamMember() {
    return;
  }

  function updateTeamMember() {
    return;
  }

  function removeTeamMember() {
    return;
  }

  return {
    account,
    addTeamMember,
    authenticated,
    hasAccessTo,
    hasSubscription,
    loading,
    refresh,
    removeTeamMember,
    seatSummary,
    sessionToken,
    signIn,
    signOut,
    signUp,
    startCheckout,
    updateAccount,
    updateLogo,
    updateTeamMember,
    activeModules
  };
}
