import Link from "next/link";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function Briefs() {
  const briefs = await db.brief.findMany({ orderBy: { updatedAt: "desc" }, include: { trend: true, _count: { select: { builds: true } } } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">App briefs</h1>
      <p className="text-sm text-zinc-400">The contract between the team and Devin. Draft → in review → approved (sent to Devin).</p>
      <table>
        <thead><tr><th>Slug</th><th>Title</th><th>Archetype</th><th>Trend</th><th>Builds</th><th>Status</th><th>Updated</th></tr></thead>
        <tbody>
          {briefs.length === 0 ? <tr><td colSpan={7} className="text-zinc-500">No briefs yet. Open a trend and generate one.</td></tr> : null}
          {briefs.map((b) => <tr key={b.id}><td><Link href={`/briefs/${b.id}`} className="font-medium">{b.slug}</Link></td><td>{b.title}</td><td className="text-zinc-400">{b.archetype}</td><td><Link href={`/trends/${b.trendId}`}>{b.trend.title}</Link></td><td>{b._count.builds}</td><td><StatusBadge status={b.status} /></td><td className="text-zinc-400">{b.updatedAt.toLocaleString()}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
