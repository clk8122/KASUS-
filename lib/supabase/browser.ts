"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function hasBrowserSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Client unique partagé par tout le navigateur : plusieurs instances GoTrue
// sur la même clé de stockage provoquent des comportements indéfinis.
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser() {
  if (!hasBrowserSupabaseConfig()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }

  return browserClient;
}
