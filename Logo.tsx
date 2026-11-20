// Text logo. Swap for <Image src="/logo.svg" /> once a logo is uploaded.
export default function Logo({ light = false }: { light?: boolean }) {
  return (<span className={`font-display text-2xl font-extrabold tracking-tight ${light ? "text-white" : "text-navy"}`}>
    <span className="mr-1 inline-block rounded-lg bg-gradient-to-br from-violet to-azure px-2 py-0.5 text-white">M</span>SAC<span className="text-coral"> Academy</span></span>);
}
