import Link from "next/link";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const [trends, candidates, briefs, builds, sources, recentTrends, recentBuilds, notes] = await Promise.all([
    db.trend.count(),
    db.trend.count({ where: { status: "candidate" } }),
    db.brief.count({ where: { status: { in: ["draft", "in_review"] } } }),
    db.buildJob.count({ where: { status: { in: ["queued", "running", "pr_opened", "blocked"] } } }),
    db.source.count({ where: { enabled: true } }),
    db.trend.findMany({ orderBy: { score: "desc" }, take: 6 }),
    db.buildJob.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { brief: true } }),
    db.note.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { trend: true, brief: true } }),
  ]);
  const configured = Boolean(process.env.DEVIN_API_KEY && process.env.DEVIN_ORG_ID);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      {!configured ? <div className="card border-amber-900 text-amber-200 text-sm">Devin is in dry-run mode: approving a brief records the exact API request without creating a session. Set DEVIN_API_KEY and DEVIN_ORG_ID in apps/hub/.env to go live.</div> : null}
      <div className="grid grid-cols-5 gap-3">
        {[["Sources on", sources], ["Trends", trends], ["Candidates", candidates], ["Briefs to review", briefs], ["Builds in flight", builds]].map(([l, v]) => (
          <div key={String(l)} className="card"><div className="text-xs text-zinc-400">{l}</div><div className="text-2xl font-bold">{v}</div></div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <section className="card">
          <h2 className="font-semibold mb-2">Top trends</h2>
          <table><thead><tr><th>Trend</th><th>Score</th><th>Status</th></tr></thead><tbody>
            {recentTrends.map((t) => <tr key={t.id}><td><Link href={`/trends/${t.id}`}>{t.title}</Link></td><td>{t.score.toFixed(2)}</td><td><StatusBadge status={t.status} /></td></tr>)}
          </tbody></table>
        </section>
        <section className="card">
          <h2 className="font-semibold mb-2">Latest builds</h2>
          <table><thead><tr><th>Game</th><th>Status</th><th>Session</th></tr></thead><tbody>
            {recentBuilds.length === 0 ? <tr><td colSpan={3} className="text-zinc-500">No builds yet. Approve a brief.</td></tr> : null}
            {recentBuilds.map((b) => <tr key={b.id}><td>{b.brief.slug}</td><td><StatusBadge status={b.status} /></td><td>{b.devinUrl ? <a href={b.devinUrl} target="_blank">open</a> : "—"}</td></tr>)}
          </tbody></table>
        </section>
      </div>
      <section className="card">
        <h2 className="font-semibold mb-2">Team activity</h2>
        <ul className="text-sm flex flex-col gap-1">
          {notes.map((n) => <li key={n.id}><span className="text-zinc-400">{n.author}</span> on {n.trend ? <Link href={`/trends/${n.trend.id}`}>{n.trend.title}</Link> : n.brief ? <Link href={`/briefs/${n.brief.id}`}>{n.brief.slug}</Link> : "—"}: {n.body}</li>)}
        </ul>
      </section>
    </div>
  );
}
