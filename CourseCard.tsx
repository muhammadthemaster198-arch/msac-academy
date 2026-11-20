import Link from "next/link";
import { Course, naira } from "@/lib/sample-courses";
export default function CourseCard({ c }: { c: Course }) {
  return (<article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-navy/10">
    <div className={`h-36 bg-gradient-to-br ${c.hue} p-4 text-sm font-semibold text-white/90`}>Sample thumbnail</div>
    <div className="flex flex-1 flex-col p-5">
      <h3 className="font-display text-xl font-bold">{c.title}</h3>
      <p className="mt-2 flex-1 text-navy/70">{c.description}</p>
      <p className="mt-3 text-sm text-navy/60">{c.level}, {c.duration}, {c.lessons} lessons</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-display text-2xl font-extrabold text-violet">{naira(c.priceNgn)}</span>
        <Link href={`/courses/${c.slug}`} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-violet">Enrol now</Link>
      </div></div></article>);
}
