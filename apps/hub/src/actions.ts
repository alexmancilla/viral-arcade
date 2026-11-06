"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppBriefSchema } from "@viral/devin-client";
import { db } from "@/lib/db";
import { runSource, rescoreTrend } from "@/lib/collectors";
import { archetypes, draftBrief, type ArchetypeName } from "@/lib/briefs";
import { getDispatcher } from "@/lib/devin";

export async function runSourceAction(formData: FormData) {
  const id = String(formData.get("sourceId"));
  try {
    await runSource(id);
  } catch (e) {
    console.error(e);
  }
  revalidatePath("/sources");
  revalidatePath("/trends");
  revalidatePath("/");
}

export async function toggleSource(formData: FormData) {
  const id = String(formData.get("sourceId"));
  const s = await db.source.findUniqueOrThrow({ where: { id } });
  await db.source.update({ where: { id }, data: { enabled: !s.enabled } });
  revalidatePath("/sources");
}

export async function addSource(formData: FormData) {
  const kind = String(formData.get("kind"));
  const name = String(formData.get("name") || kind);
  const config = String(formData.get("config") || "{}");
  JSON.parse(config);
  await db.source.create({ data: { name, kind, config } });
  revalidatePath("/sources");
}

export async function addManualItem(formData: FormData) {
  const trendId = String(formData.get("trendId"));
  const url = String(formData.get("url"));
  const views = Number(formData.get("views") || 0);
  const platform = String(formData.get("platform") || "tiktok");
  const manual = (await db.source.findFirst({ where: { kind: "manual" } })) ?? (await db.source.create({ data: { id: "src_manual", name: "Team submissions", kind: "manual", cadenceH: 0 } }));
  await db.trendItem.upsert({
    where: { platform_externalId: { platform, externalId: url } },
    create: { trendId, sourceId: manual.id, platform, externalId: url, url, caption: String(formData.get("caption") || ""), views, postedAt: new Date() },
    update: { views },
  });
  await rescoreTrend(trendId);
  revalidatePath(`/trends/${trendId}`);
}

export async function createTrend(formData: FormData) {
  const title = String(formData.get("title")).trim();
  if (!title) return;
  const t = await db.trend.create({ data: { title, summary: String(formData.get("summary") || ""), mechanic: String(formData.get("mechanic") || ""), status: "candidate", score: 0 } });
  redirect(`/trends/${t.id}`);
}

export async function updateTrend(formData: FormData) {
  const id = String(formData.get("trendId"));
  const archetype = String(formData.get("archetype") || "");
  await db.trend.update({
    where: { id },
    data: {
      archetype: archetypes.includes(archetype as ArchetypeName) ? archetype : null,
      mechanic: String(formData.get("mechanic") ?? ""),
      status: String(formData.get("status") || "watching"),
    },
  });
  revalidatePath(`/trends/${id}`);
  revalidatePath("/trends");
}

export async function generateBrief(formData: FormData) {
  const trendId = String(formData.get("trendId"));
  const title = String(formData.get("title")).trim();
  const archetype = String(formData.get("archetype")) as ArchetypeName;
  const trend = await db.trend.findUniqueOrThrow({ where: { id: trendId }, include: { items: { orderBy: { views: "desc" }, take: 3 } } });
  const briefId = `brf_${Date.now().toString(36)}`;
  const brief = draftBrief({ briefId, trendTitle: trend.title, mechanic: trend.mechanic, sources: trend.items.map((i) => i.url), score: trend.score, archetype, title });
  const row = await db.brief.create({ data: { trendId, slug: brief.slug, title: brief.title, archetype, body: JSON.stringify(brief, null, 2) } });
  await db.trend.update({ where: { id: trendId }, data: { status: "briefed", archetype } });
  redirect(`/briefs/${row.id}`);
}

export async function saveBrief(formData: FormData) {
  const id = String(formData.get("briefId"));
  const body = String(formData.get("body"));
  const parsed = AppBriefSchema.safeParse(JSON.parse(body));
  if (!parsed.success) {
    await db.brief.update({ where: { id }, data: { body, reviewNotes: `Invalid: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}` } });
  } else {
    await db.brief.update({ where: { id }, data: { body: JSON.stringify(parsed.data, null, 2), slug: parsed.data.slug, title: parsed.data.title, archetype: parsed.data.archetype, status: String(formData.get("status") || "in_review"), reviewNotes: String(formData.get("reviewNotes") ?? "") } });
  }
  revalidatePath(`/briefs/${id}`);
}

/** The approve button: validate, build the Devin request, create the session (or a dry-run job), record the BuildJob. */
export async function approveAndDispatch(formData: FormData) {
  const id = String(formData.get("briefId"));
  const brief = await db.brief.findUniqueOrThrow({ where: { id } });
  const { dispatcher, configured } = getDispatcher();
  const raw = JSON.parse(brief.body);
  const result = await dispatcher.dispatch(raw, { reviewerNotes: brief.reviewNotes || undefined });
  const job = await db.buildJob.create({
    data: {
      briefId: id,
      status: result.dryRun ? "dry_run" : "queued",
      devinSessionId: result.session?.session_id ?? null,
      devinUrl: result.session?.url ?? null,
      rawStatus: result.session?.status ?? null,
      request: JSON.stringify(result.request, null, 2),
    },
  });
  await db.brief.update({ where: { id }, data: { status: configured ? "dispatched" : "approved" } });
  await db.trend.update({ where: { id: brief.trendId }, data: { status: "building" } });
  await db.game.upsert({ where: { slug: brief.slug }, update: { briefId: id }, create: { slug: brief.slug, title: brief.title, briefId: id, enabled: false } });
  redirect(`/builds#${job.id}`);
}

export async function refreshBuild(formData: FormData) {
  const id = String(formData.get("buildId"));
  await refreshBuildById(id);
  revalidatePath("/builds");
}

export async function refreshBuildById(id: string) {
  const job = await db.buildJob.findUniqueOrThrow({ where: { id } });
  if (!job.devinSessionId) return;
  const { dispatcher, configured } = getDispatcher();
  if (!configured) return;
  const view = await dispatcher.refresh(job.devinSessionId);
  await db.buildJob.update({
    where: { id },
    data: { status: view.status, rawStatus: view.rawStatus, prUrl: view.prUrl, previewChannel: view.output?.preview_channel ?? null, acusConsumed: view.acusConsumed, output: view.output ? JSON.stringify(view.output, null, 2) : null },
  });
  if (view.status === "done") {
    const brief = await db.brief.findUnique({ where: { id: job.briefId } });
    if (brief) await db.trend.update({ where: { id: brief.trendId }, data: { status: "live" } });
  }
}

export async function sendFeedback(formData: FormData) {
  const id = String(formData.get("buildId"));
  const message = String(formData.get("message")).trim();
  const job = await db.buildJob.findUniqueOrThrow({ where: { id } });
  const { dispatcher, configured } = getDispatcher();
  if (configured && job.devinSessionId && message) await dispatcher.feedback(job.devinSessionId, message);
  revalidatePath("/builds");
}

export async function toggleGame(formData: FormData) {
  const slug = String(formData.get("slug"));
  const g = await db.game.findUniqueOrThrow({ where: { slug } });
  await db.game.update({ where: { slug }, data: { enabled: !g.enabled } });
  revalidatePath("/games");
}

export async function addNote(formData: FormData) {
  const trendId = String(formData.get("trendId") || "") || null;
  const briefId = String(formData.get("briefId") || "") || null;
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  await db.note.create({ data: { trendId, briefId, body, author: String(formData.get("author") || "team").trim() || "team" } });
  if (trendId) revalidatePath(`/trends/${trendId}`);
  if (briefId) revalidatePath(`/briefs/${briefId}`);
  revalidatePath("/");
}
