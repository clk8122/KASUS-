import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "./supabase/server";

export type AuthContext = {
  userId: string;
  email: string;
};

export function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

export async function requireAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return {
    userId: data.user.id,
    email: data.user.email ?? ""
  };
}
