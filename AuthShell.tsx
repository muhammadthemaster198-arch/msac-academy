import PageHead from "./PageHead";
export default function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (<main><PageHead title={title} intro={intro} /><div className="mx-auto max-w-md px-5 py-10"><div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/10">{children}</div></div></main>);
}
