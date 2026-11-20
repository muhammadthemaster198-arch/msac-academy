import { createClient } from "./server";
// Returns the signed-in user or null. Never throws (also null if env vars are missing).
export async function getUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try { const { data } = await createClient().auth.getUser(); return data.user; } catch { return null; }
}
