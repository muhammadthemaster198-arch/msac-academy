"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

export type State = { error?: string; ok?: string };
const email = z.string().trim().toLowerCase().email("Enter a valid email address.");
const password = z.string().min(8, "Password must be at least 8 characters.").max(72, "Password is too long.");
const first = (e: z.ZodError) => e.issues[0]?.message ?? "Check your details and try again.";
const siteUrl = () => headers().get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";
const configured = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const NOT_CONFIGURED: State = { error: "The site is not connected to its database yet. Please try again later." };

export async function register(_: State, fd: FormData): Promise<State> {
  if (!configured()) return NOT_CONFIGURED;
  const p = z.object({ fullName: z.string().trim().min(2, "Enter your full name.").max(100), email, password, confirm: z.string() })
    .refine(v => v.password === v.confirm, { message: "Passwords do not match.", path: ["confirm"] })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: first(p.error) };
  const { data, error } = await createClient().auth.signUp({ email: p.data.email, password: p.data.password,
    options: { data: { full_name: p.data.fullName }, emailRedirectTo: `${siteUrl()}/auth/callback?next=/dashboard` } });
  if (error) return { error: "We could not create the account. Try again or use a different email." };
  if (data.session) redirect("/dashboard");
  // Same message whether or not the email already existed (prevents account guessing).
  return { ok: "Almost done. Check your email and open the confirmation link to activate your account." };
}

export async function login(_: State, fd: FormData): Promise<State> {
  if (!configured()) return NOT_CONFIGURED;
  const p = z.object({ email, password: z.string().min(1, "Enter your password.") }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: first(p.error) };
  const { error } = await createClient().auth.signInWithPassword(p.data);
  if (error) return { error: error.message.toLowerCase().includes("confirm") ? "Please confirm your email first. Check your inbox." : "Incorrect email or password." };
  redirect(safeNext(fd.get("next")));
}

export async function signOut() {
  if (configured()) await createClient().auth.signOut();
  redirect("/");
}

export async function requestReset(_: State, fd: FormData): Promise<State> {
  if (!configured()) return NOT_CONFIGURED;
  const p = z.object({ email }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: first(p.error) };
  await createClient().auth.resetPasswordForEmail(p.data.email, { redirectTo: `${siteUrl()}/auth/callback?next=/reset-password` });
  return { ok: "If an account exists for that email, a reset link has been sent." };
}

export async function updatePassword(_: State, fd: FormData): Promise<State> {
  if (!configured()) return NOT_CONFIGURED;
  const p = z.object({ password, confirm: z.string() }).refine(v => v.password === v.confirm, { message: "Passwords do not match.", path: ["confirm"] })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: first(p.error) };
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: p.data.password });
  if (error) return { error: "Could not update the password. Try a different one." };
  redirect("/dashboard");
}

export async function updateProfile(_: State, fd: FormData): Promise<State> {
  if (!configured()) return NOT_CONFIGURED;
  const p = z.object({ fullName: z.string().trim().min(2, "Enter your full name.").max(100),
    phone: z.string().trim().max(30, "Phone number is too long.").regex(/^[0-9+()\-\s]*$/, "Phone can contain digits, spaces and + only.") }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: first(p.error) };
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { error } = await supabase.from("profiles").update({ full_name: p.data.fullName, phone: p.data.phone || null }).eq("id", data.user.id);
  return error ? { error: "Could not save your profile." } : { ok: "Profile saved." };
}
