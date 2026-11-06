import { db } from "@/lib/db";
import { collectors } from "@/lib/collectors";
import { addSource, runSourceAction, toggleSource } from "@/actions";

export const dynamic = "force-dynamic";

export default async function Sources() {
  const sources = await db.source.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { items: true } } } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Trend sources</h1>
      <p className="text-sm text-zinc-400">Where trends come from. Each source is an adapter; run it by hand here or on a schedule (Phase 1 worker). Items are grouped into trends by hashtag and scored by growth.</p>
      <table>
        <thead><tr><th>Source</th><th>Kind</th><th>Config</th><th>Items</th><th>Last run</th><th>Note</th><th></th></tr></thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.id}>
              <td className="font-medium">{s.name}</td>
              <td>{collectors[s.kind]?.label ?? s.kind}</td>
              <td className="font-mono text-xs text-zinc-400">{s.config}</td>
              <td>{s._count.items}</td>
              <td className="text-zinc-400">{s.lastRunAt ? s.lastRunAt.toLocaleString() : "never"}</td>
              <td className="text-zinc-400 text-xs">{s.lastError ?? ""}</td>
              <td className="flex gap-2">
                <form action={runSourceAction}><input type="hidden" name="sourceId" value={s.id} /><button className="btn" disabled={s.kind === "manual"}>Run now</button></form>
                <form action={toggleSource}><input type="hidden" name="sourceId" value={s.id} /><button className="btn-ghost">{s.enabled ? "Disable" : "Enable"}</button></form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="card max-w-xl">
        <h2 className="font-semibold mb-3">Add a source</h2>
        <form action={addSource} className="flex flex-col gap-2">
          <input name="name" placeholder="Name" />
          <select name="kind" defaultValue="reddit">{Object.values(collectors).map((c) => <option key={c.kind} value={c.kind}>{c.label}</option>)}</select>
          <input name="config" placeholder='{"subreddit":"TikTokCringe"} or {"region":"MX"}' defaultValue="{}" />
          <button className="btn self-start">Add</button>
        </form>
      </section>
    </div>
  );
}
