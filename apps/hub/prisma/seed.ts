import { PrismaClient } from "@prisma/client";
import { runSource } from "../src/lib/collectors/index";

const db = new PrismaClient();

async function main() {
  const sample = await db.source.upsert({ where: { id: "src_sample" }, update: {}, create: { id: "src_sample", name: "Sample data", kind: "sample", cadenceH: 24 } });
  await db.source.upsert({ where: { id: "src_youtube_us" }, update: {}, create: { id: "src_youtube_us", name: "YouTube trending US", kind: "youtube_trending", config: JSON.stringify({ region: "US" }), enabled: false } });
  await db.source.upsert({ where: { id: "src_youtube_mx" }, update: {}, create: { id: "src_youtube_mx", name: "YouTube trending MX", kind: "youtube_trending", config: JSON.stringify({ region: "MX" }), enabled: false } });
  await db.source.upsert({ where: { id: "src_reddit" }, update: {}, create: { id: "src_reddit", name: "r/TikTokCringe top", kind: "reddit", config: JSON.stringify({ subreddit: "TikTokCringe" }), enabled: false } });
  await runSource(sample.id);

  const reverse = await db.trend.findFirst({ where: { title: "#reversechallenge" } });
  if (reverse) {
    await db.trend.update({ where: { id: reverse.id }, data: { archetype: "guess_phrase", mechanic: "Creator says a phrase reversed; friends guess the original phrase", status: "live" } });
    await db.note.create({ data: { trendId: reverse.id, author: "ale", body: "Already shipped as Reverse It in the arcade. Watch invite_open_rate." } });
  }
  const impostor = await db.trend.findFirst({ where: { title: "#impostorgame" } });
  if (impostor) await db.trend.update({ where: { id: impostor.id }, data: { archetype: "impostor", mechanic: "Group gets one word, one player gets a different one; discuss and vote", status: "live" } });

  await db.game.upsert({ where: { slug: "reverse-it" }, update: {}, create: { slug: "reverse-it", title: "Reverse It", enabled: true } });
  await db.game.upsert({ where: { slug: "impostor" }, update: {}, create: { slug: "impostor", title: "Find the Impostor", enabled: true } });
}

main().finally(() => db.$disconnect());
