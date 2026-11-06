import Link from "next/link";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { refreshBuild, sendFeedback } from "@/actions";

export const dynamic = "force-dynamic";

export default async function Builds() {
  const builds = await db.buildJob.findMany({ orderBy: { createdAt: "desc" }, include: { brief: true } });
  const configured = Boolean(process.env.DEVIN_API_KEY && process.env.DEVIN_ORG_ID);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Builds</h1>
      <p className="text-sm text-zinc-400">One row per Devin session. Refresh pulls status, PR and structured output from the Devin API; feedback is sent into the same session.</p>
      {builds.length === 0 ? <p className="text-zinc-500">No builds yet.</p> : null}
      {builds.map((b) => (
        <section key={b.id} id={b.id} className="card flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold">{b.brief.slug}</span>
            <StatusBadge status={b.status} />
            <span className="text-xs text-zinc-400">{b.acusConsumed} ACU · {b.createdAt.toLocaleString()}</span>
            <span className="flex-1" />
            <Link href={`/briefs/${b.briefId}`} className="text-sm">brief</Link>
            {b.devinUrl ? <a href={b.devinUrl} target="_blank" className="text-sm">Devin session</a> : null}
            {b.prUrl ? <a href={b.prUrl} target="_blank" className="text-sm">PR</a> : null}
            {b.previewChannel ? <span className="badge">eas branch {b.previewChannel}</span> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <details><summary className="text-sm text-zinc-400 cursor-pointer">Request sent to Devin</summary><pre className="text-xs bg-zinc-950 rounded-lg p-3 overflow-auto max-h-80 mt-2">{b.request}</pre></details>
            <div>
              <div className="text-sm text-zinc-400">Structured output</div>
              <pre className="text-xs bg-zinc-950 rounded-lg p-3 overflow-auto max-h-80 mt-2">{b.output ?? (b.status === "dry_run" ? "dry run: no session was created" : "not reported yet")}</pre>
            </div>
          </div>
          {b.devinSessionId ? (
            <div className="flex gap-2">
              <form action={refreshBuild}><input type="hidden" name="buildId" value={b.id} /><button className="btn-ghost" disabled={!configured}>Refresh</button></form>
              <form action={sendFeedback} className="flex gap-2 flex-1"><input type="hidden" name="buildId" value={b.id} /><input name="message" placeholder="Feedback for Devin (goes into the session)" /><button className="btn" disabled={!configured}>Send</button></form>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
