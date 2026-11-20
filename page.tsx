import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";
import { register } from "@/app/auth/actions";
export const metadata = { title: "Create account | MSAC Academy" };
export default function Page() {
  return (<AuthShell title="Create your account" intro="Join MSAC Academy to start learning graphic design.">
    <AuthForm action={register} submit="Create account" fields={[
      { name: "fullName", label: "Full name", autoComplete: "name" },
      { name: "email", label: "Email", type: "email", autoComplete: "email" },
      { name: "password", label: "Password (8+ characters)", type: "password", autoComplete: "new-password" },
      { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password" }]} />
    <p className="mt-4 text-sm">Already have an account? <Link className="font-semibold text-violet underline" href="/login">Log in</Link></p>
  </AuthShell>);
}
