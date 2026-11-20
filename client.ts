import { createBrowserClient } from "@supabase/ssr";
// Browser client: uses only the public URL and publishable key. Safe to expose; RLS protects data.
export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
