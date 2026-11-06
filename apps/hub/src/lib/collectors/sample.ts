import type { Collector, RawItem } from "./types";

/** Deterministic fixture so the hub is useful without any API key. */
const fixtures: Array<Omit<RawItem, "postedAt"> & { hoursAgo: number }> = [
  { platform: "tiktok", externalId: "s1", url: "https://www.tiktok.com/@demo/video/1", caption: "saying phrases backwards and my friend has to guess #reversechallenge", author: "demo1", views: 2_400_000, likes: 310_000, shares: 42_000, hoursAgo: 18, tags: ["reversechallenge"] },
  { platform: "tiktok", externalId: "s2", url: "https://www.tiktok.com/@demo/video/2", caption: "reverse words challenge with my sister #reversechallenge", author: "demo2", views: 900_000, likes: 120_000, shares: 15_000, hoursAgo: 9, tags: ["reversechallenge"] },
  { platform: "youtube", externalId: "s3", url: "https://www.youtube.com/shorts/s3", caption: "REVERSE SPEECH CHALLENGE (impossible)", author: "demo3", views: 600_000, likes: 50_000, shares: 0, hoursAgo: 30, tags: ["reversechallenge"] },
  { platform: "tiktok", externalId: "s4", url: "https://www.tiktok.com/@demo/video/4", caption: "one of us has a different word, find the impostor #impostorgame", author: "demo4", views: 5_100_000, likes: 700_000, shares: 90_000, hoursAgo: 60, tags: ["impostorgame"] },
  { platform: "tiktok", externalId: "s5", url: "https://www.tiktok.com/@demo/video/5", caption: "guess the song from the emoji #emojisong", author: "demo5", views: 300_000, likes: 20_000, shares: 2_000, hoursAgo: 80, tags: ["emojisong"] },
  { platform: "tiktok", externalId: "s6", url: "https://www.tiktok.com/@demo/video/6", caption: "react before the beat drops #reactiontest", author: "demo6", views: 1_200_000, likes: 150_000, shares: 30_000, hoursAgo: 12, tags: ["reactiontest"] },
];

export const sampleCollector: Collector = {
  kind: "sample",
  label: "Sample data (offline)",
  async collect() {
    const now = Date.now();
    return { items: fixtures.map(({ hoursAgo, ...f }) => ({ ...f, postedAt: new Date(now - hoursAgo * 36e5) })), note: "fixture" };
  },
};
