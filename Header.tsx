import Link from "next/link";
import Logo from "./Logo";
import { getUser } from "@/lib/supabase/user";
import { signOut } from "@/app/auth/actions";
const links = [["Home","/"],["About","/about"],["Courses","/courses"],["Contact","/contact"]];
export default async function Header() {
  const user = await getUser();
  return (<header className="sticky top-0 z-40 border-b border-navy/10 bg-paper/90 backdrop-blur">
    <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
      <Link href="/" aria-label="MSAC Academy home"><Logo /></Link>
      <ul className="hidden items-center gap-7 text-sm font-medium md:flex">
        {links.map(([l,h]) => <li key={h}><Link className="hover:text-violet" href={h}>{l}</Link></li>)}
      </ul>
      <div className="flex items-center gap-2">
        {user ? (<>
          <Link href="/dashboard" className="rounded-full px-3 py-2 text-sm font-semibold hover:text-violet">Dashboard</Link>
          <form action={signOut}><button className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-violet">Log out</button></form>
        </>) : (<>
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold hover:text-violet">Login</Link>
          <Link href="/register" className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-violet">Get started</Link>
        </>)}
      </div>
    </nav>
    <ul className="flex justify-center gap-5 border-t border-navy/5 py-2 text-sm font-medium md:hidden">
      {links.map(([l,h]) => <li key={h}><Link className="inline-block px-2 py-2" href={h}>{l}</Link></li>)}
    </ul>
  </header>);
}
