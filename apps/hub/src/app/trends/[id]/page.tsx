import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { archetypes } from "@/lib/briefs";
import { StatusBadge } from "@/components/StatusBadge";
import { Notes } from "@/components/Notes";
import { addManualItem, generateBrief, updateTrend } from "@/actions";

export const dynamic = "force-dynamic";

export default async function TrendDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trend = await db.trend.findUnique({ where: { id }, include: { items: { orderBy: { views: "desc" }, include: { source: true } }, briefs: { orderBy: { createdAt: "desc" } }, notes: { orderBy: { createdAt: "desc" } } } });
  if (!trend) notFound();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/trends" className="text-sm">← Trends</Link>
        <h1 className="text-2xl font-bold mt-1 flex items-center gap-3">{trend.title} <StatusBadge status={trend.status} /></h1>
        <p className="text-sm text-zinc-400">Score {trend.score.toFixed(2)} · {Math.round(trend.velocity).toLocaleString()} views/h · {trend.platforms || "no platforms"} · first seen {trend.firstSeen.toLocaleDateString()}</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <section className="card">
          <h2 className="font-semibold mb-3">Mechanic and archetype</h2>
          <form action={updateTrend} className="flex flex-col gap-2">
            <input type="hidden" name="trendId" value={trend.id} />
            <textarea name="mechanic" rows={3} defaultValue={trend.mechanic} placeholder="What are people actually doing? Rules, inputs, win condition." />
            <div className="flex gap-2">
              <select name="archetype" key={`a-${trend.archetype ?? ""}`} defaultValue={trend.archetype ?? ""}><option value="">no archetype</option>{archetypes.map((a) => <option key={a} value={a}>{a}</option>)}</select>
              <select name="status" key={`s-${trend.status}`} defaultValue={trend.status}>{["watching", "candidate", "briefed", "building", "live", "retired"].map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <button className="btn-ghost self-start">Save</button>
          </form>
        </section>
        <section className="card">
          <h2 className="font-semibold mb-3">Make a brief</h2>
          <p className="text-xs text-zinc-400 mb-2">Drafts an AppBrief from the archetype defaults. You edit and approve it on the next screen; approval sends it to Devin.</p>
          <form action={generateBrief} className="flex flex-col gap-2">
            <input type="hidden" name="trendId" value={trend.id} />
            <input name="title" placeholder="Game title (max 30 chars)" required maxLength={30} />
            <select name="archetype" defaultValue={trend.archetype ?? "guess_phrase"}>{archetypes.map((a) => <option key={a} value={a}>{a}</option>)}</select>
            <button className="btn self-start">Generate brief</button>
          </form>
          {trend.briefs.length ? <ul className="mt-3 text-sm">{trend.briefs.map((b) => <li key={b.id}><Link href={`/briefs/${b.id}`}>{b.slug}</Link> <StatusBadge status={b.status} /></li>)}</ul> : null}
        </section>
      </div>
      <section className="card">
        <h2 className="font-semibold mb-3">Source videos ({trend.items.length})</h2>
        <table>
          <thead><tr><th>Platform</th><th>Caption</th><th>Author</th><th>Views</th><th>Posted</th><th>Source</th></tr></thead>
          <tbody>
            {trend.items.map((i) => <tr key={i.id}><td>{i.platform}</td><td><a href={i.url} target="_blank">{i.caption || i.url}</a></td><td className="text-zinc-400">{i.author}</td><td>{i.views.toLocaleString()}</td><td className="text-zinc-400">{i.postedAt.toLocaleDateString()}</td><td className="text-zinc-400">{i.source.name}</td></tr>)}
          </tbody>
        </table>
        <form action={addManualItem} className="flex gap-2 mt-3">
          <input type="hidden" name="trendId" value={trend.id} />
          <select name="platform" className="!w-32" defaultValue="tiktok">{["tiktok", "youtube", "instagram", "reddit", "x"].map((p) => <option key={p}>{p}</option>)}</select>
          <input name="url" placeholder="Paste a video URL" required />
          <input name="caption" placeholder="Caption" />
          <input name="views" placeholder="Views" className="!w-28" />
          <button className="btn">Add</button>
        </form>
      </section>
      <Notes notes={trend.notes} trendId={trend.id} />
    </div>
  );
}
