import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";
import { updatePassword } from "@/app/auth/actions";
import { getUser } from "@/lib/supabase/user";
export const metadata = { title: "Choose a new password | MSAC Academy" };
export default async function Page() {
  const user = await getUser();
  return (<AuthShell title="New password" intro="Choose a new password for your account.">
    {user ? <AuthForm action={updatePassword} submit="Save new password" fields={[
      { name: "password", label: "New password (8+ characters)", type: "password", autoComplete: "new-password" },
      { name: "confirm", label: "Confirm new password", type: "password", autoComplete: "new-password" }]} />
    : <p>This reset link is missing or has expired. <Link className="font-semibold text-violet underline" href="/forgot-password">Request a new one</Link>.</p>}
  </AuthShell>);
}
