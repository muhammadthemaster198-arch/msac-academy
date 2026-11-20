import { createClient } from "@supabase/supabase-js";
// SERVER ONLY. Bypasses RLS. Used for payment verification (writing payments/enrolments).
// Never import this file from a client component.
export const createAdminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
