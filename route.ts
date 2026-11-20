import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
// Email confirmation and password-reset links land here.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code"), tokenHash = searchParams.get("token_hash"), type = searchParams.get("type");
  const next = safeNext(searchParams.get("next"));
  const supabase = createClient();
  let failed = true;
  if (tokenHash && type) failed = !!(await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash })).error;
  else if (code) failed = !!(await supabase.auth.exchangeCodeForSession(code)).error;
  return NextResponse.redirect(`${origin}${failed ? "/login?error=link" : next}`);
}
