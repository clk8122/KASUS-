import { NextResponse } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export function GET() {
  // On expose uniquement des booléens de présence (jamais la valeur des clés).
  // En production aussi : sinon /systeme affiche toujours "ok" et ne peut pas
  // révéler qu'une variable comme OPENAI_API_KEY manque, ce qui rend l'analyse
  // IA "muette" sans explication.
  return NextResponse.json({
    status: "ok",
    openai: Boolean(process.env.OPENAI_API_KEY),
    supabase: hasSupabaseConfig(),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    storage: hasSupabaseConfig()
  });
}
