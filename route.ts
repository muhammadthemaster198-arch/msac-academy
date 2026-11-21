import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// Open /api/health on your deployed site to test the Supabase connection. Never prints keys.
export async function GET() {
  const env = { url: !!process.env.NEXT_PUBLIC_SUPABASE_URL, publishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
  if (!env.url || !env.publishableKey) return NextResponse.json({ ok: false, env, error: "Missing environment variables" }, { status: 500 });
  const { error } = await createClient().from("courses").select("id").limit(1);
  return NextResponse.json({ ok: !error, env, database: error ? error.message : "reachable, tables found" }, { status: error ? 500 : 200 });
}
