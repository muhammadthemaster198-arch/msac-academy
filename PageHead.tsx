export default function PageHead({ title, intro }: { title: string; intro: string }) {
  return (<section className="bg-navy text-white"><div className="mx-auto max-w-6xl px-5 py-14">
    <h1 className="font-display text-4xl font-extrabold sm:text-5xl">{title}</h1>
    <p className="mt-3 max-w-prose text-lg text-white/75">{intro}</p></div></section>);
}
