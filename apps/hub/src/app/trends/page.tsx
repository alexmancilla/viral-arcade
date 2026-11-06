import Link from "next/link";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { createTrend } from "@/actions";

export const dynamic = "force-dynamic";

export default async function Trends({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const trends = await db.trend.findMany({ where: status ? { status } : undefined, orderBy: { score: "desc" }, include: { _count: { select: { items: true, briefs: true } } } });
  const statuses = ["watching", "candidate", "briefed", "building", "live", "retired"];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trend catalog</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/trends" className={!status ? "font-semibold" : ""}>all</Link>
          {statuses.map((s) => <Link key={s} href={`/trends?status=${s}`} className={status === s ? "font-semibold" : ""}>{s}</Link>)}
        </div>
      </div>
      <table>
        <thead><tr><th>Trend</th><th>Score</th><th>Views/h</th><th>Platforms</th><th>Archetype</th><th>Items</th><th>Briefs</th><th>Status</th></tr></thead>
        <tbody>
          {trends.map((t) => (
            <tr key={t.id}>
              <td><Link href={`/trends/${t.id}`} className="font-medium">{t.title}</Link><div className="text-xs text-zinc-500">{t.summary}</div></td>
              <td>{t.score.toFixed(2)}</td>
              <td>{Math.round(t.velocity).toLocaleString()}</td>
              <td className="text-zinc-400">{t.platforms || "—"}</td>
              <td className="text-zinc-400">{t.archetype ?? "—"}</td>
              <td>{t._count.items}</td>
              <td>{t._count.briefs}</td>
              <td><StatusBadge status={t.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="card max-w-xl">
        <h2 className="font-semibold mb-3">Add a trend by hand</h2>
        <p className="text-xs text-zinc-400 mb-2">Saw something on your feed? Drop it here so the team can discuss it and attach videos.</p>
        <form action={createTrend} className="flex flex-col gap-2">
          <input name="title" placeholder="Title, e.g. #whisperchallenge" required />
          <input name="summary" placeholder="One line on what people do" />
          <input name="mechanic" placeholder="Mechanic as rules (optional)" />
          <button className="btn self-start">Create</button>
        </form>
      </section>
    </div>
  );
}
