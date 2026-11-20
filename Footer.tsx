import Logo from "./Logo";
import { site } from "@/lib/site";
export default function Footer() {
  return (<footer className="bg-navy text-white"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
    <div><Logo light /><p className="mt-3 text-white/70">{site.tagline}</p></div>
    <div><h2 className="font-display text-lg font-bold">Contact</h2>
      <p className="mt-2 text-white/70">{site.email}</p><p className="text-white/70">WhatsApp: {site.whatsapp}</p></div>
    <div><h2 className="font-display text-lg font-bold">Follow us</h2>
      <ul className="mt-2 flex gap-4 text-white/70">{Object.entries(site.socials).map(([n,h]) => <li key={n}><a className="capitalize hover:text-sun" href={h}>{n}</a></li>)}</ul></div>
  </div><p className="border-t border-white/10 py-4 text-center text-sm text-white/50">© {new Date().getFullYear()} MSAC Academy</p></footer>);
}
