import { NextResponse } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({
      status: "ok"
    });
  }

  return NextResponse.json({
    openai: Boolean(process.env.OPENAI_API_KEY),
    supabase: hasSupabaseConfig(),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    storage: hasSupabaseConfig()
  });
}
