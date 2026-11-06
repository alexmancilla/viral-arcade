import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getDispatcher } from "@/lib/devin";
import { StatusBadge } from "@/components/StatusBadge";
import { Notes } from "@/components/Notes";
import { approveAndDispatch, saveBrief } from "@/actions";
import { REVIEW_STATUSES } from "@/lib/briefs";

export const dynamic = "force-dynamic";

export default async function BriefDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brief = await db.brief.findUnique({ where: { id }, include: { trend: true, builds: { orderBy: { createdAt: "desc" } }, notes: { orderBy: { createdAt: "desc" } } } });
  if (!brief) notFound();
  const { dispatcher, configured } = getDispatcher();
  let preview: string | null = null;
  let problem: string | null = null;
  try {
    preview = JSON.stringify(dispatcher.prepare(JSON.parse(brief.body), { attemptId: "<build id, assigned on approve>" }).request, null, 2);
  } catch (e) {
    problem = (e as Error).message;
  }
  const canApprove = !problem && ["draft", "in_review", "approved"].includes(brief.status);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/briefs" className="text-sm">← Briefs</Link>
        <h1 className="text-2xl font-bold mt-1 flex items-center gap-3">{brief.title} <StatusBadge status={brief.status} /></h1>
        <p className="text-sm text-zinc-400">From <Link href={`/trends/${brief.trendId}`}>{brief.trend.title}</Link> · archetype {brief.archetype}</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <section className="card">
          <h2 className="font-semibold mb-3">Brief (AppBrief JSON)</h2>
          <form action={saveBrief} className="flex flex-col gap-2">
            <input type="hidden" name="briefId" value={brief.id} />
            <textarea name="body" rows={28} defaultValue={brief.body} className="font-mono text-xs" />
            <input name="reviewNotes" placeholder="Reviewer notes for Devin (optional)" defaultValue={brief.reviewNotes.startsWith("Invalid:") ? "" : brief.reviewNotes} />
            <div className="flex gap-2">
              <select name="status" defaultValue={brief.status === "draft" ? "in_review" : brief.status} className="!w-40">{Array.from(new Set([...REVIEW_STATUSES, brief.status])).map((s) => <option key={s}>{s}</option>)}</select>
              <button className="btn-ghost">Save</button>
            </div>
          </form>
          {brief.reviewNotes.startsWith("Invalid:") ? <p className="text-rose-300 text-xs mt-2">{brief.reviewNotes}</p> : null}
        </section>
        <section className="card flex flex-col gap-3">
          <h2 className="font-semibold">Send to Devin</h2>
          {problem ? <p className="text-rose-300 text-sm">Brief does not validate: {problem.split("\n")[0]}</p> : <p className="text-sm text-zinc-400">This is the exact request the hub will send to the Devin API. {configured ? "A session will be created." : "Devin is not configured, so approving records a dry run."}</p>}
          <pre className="text-xs bg-zinc-950 rounded-lg p-3 overflow-auto max-h-96">{preview ?? ""}</pre>
          <form action={approveAndDispatch}>
            <input type="hidden" name="briefId" value={brief.id} />
            <button className="btn" disabled={!canApprove}>{configured ? "Approve and create Devin session" : "Approve (dry run)"}</button>
          </form>
          {brief.builds.length ? <ul className="text-sm">{brief.builds.map((b) => <li key={b.id}><Link href="/builds">build {b.id.slice(-6)}</Link> <StatusBadge status={b.status} /> {b.devinUrl ? <a href={b.devinUrl} target="_blank">session</a> : null}</li>)}</ul> : null}
        </section>
      </div>
      <Notes notes={brief.notes} briefId={brief.id} />
    </div>
  );
}
