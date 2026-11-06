import { db } from "../db";
import { scoreTrend, statusForScore } from "../scoring";
import { redditCollector } from "./reddit";
import { sampleCollector } from "./sample";
import type { Collector, RawItem } from "./types";
import { youtubeCollector } from "./youtube";

export const collectors: Record<string, Collector> = Object.fromEntries(
  [sampleCollector, youtubeCollector, redditCollector].map((c) => [c.kind, c]),
);

function trendKey(item: RawItem): string | null {
  const tag = item.tags.find((t) => t.length >= 4);
  return tag ?? null;
}

/**
 * Runs one source: fetch, upsert items, group into trends by tag (v0 clustering), rescore.
 * The LLM mechanic extractor plugs in after grouping (Phase 1).
 */
export async function runSource(sourceId: string): Promise<{ fetched: number; trendsTouched: number; note?: string }> {
  const source = await db.source.findUniqueOrThrow({ where: { id: sourceId } });
  const collector = collectors[source.kind];
  if (!collector) throw new Error(`no collector for kind ${source.kind}`);
  let result: { items: RawItem[]; note?: string };
  try {
    result = await collector.collect(JSON.parse(source.config || "{}"));
  } catch (e) {
    await db.source.update({ where: { id: sourceId }, data: { lastRunAt: new Date(), lastError: (e as Error).message } });
    throw e;
  }
  const touched = new Set<string>();
  for (const item of result.items) {
    const key = trendKey(item);
    let trendId: string | null = null;
    if (key) {
      const title = `#${key}`;
      const existing = await db.trend.findFirst({ where: { title } });
      const trend = existing ?? (await db.trend.create({ data: { title, summary: item.caption.slice(0, 140) } }));
      trendId = trend.id;
      touched.add(trend.id);
    }
    await db.trendItem.upsert({
      where: { platform_externalId: { platform: item.platform, externalId: item.externalId } },
      create: { ...stripTags(item), sourceId, trendId },
      update: { views: item.views, likes: item.likes, shares: item.shares, fetchedAt: new Date(), trendId: trendId ?? undefined },
    });
  }
  for (const id of touched) await rescoreTrend(id);
  await db.source.update({ where: { id: sourceId }, data: { lastRunAt: new Date(), lastError: result.note ?? null } });
  return { fetched: result.items.length, trendsTouched: touched.size, note: result.note };
}

function stripTags(item: RawItem) {
  const { tags: _tags, ...rest } = item;
  return rest;
}

export async function rescoreTrend(trendId: string): Promise<void> {
  const trend = await db.trend.findUniqueOrThrow({ where: { id: trendId }, include: { items: true } });
  const { score, velocity, platforms } = scoreTrend(trend.items);
  await db.trend.update({ where: { id: trendId }, data: { score, velocity, platforms: platforms.join(","), status: statusForScore(score, trend.status) } });
}
