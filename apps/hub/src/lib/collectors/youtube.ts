import type { Collector, RawItem } from "./types";

/** YouTube Data API v3, most popular videos in a region. Needs YOUTUBE_API_KEY. */
export const youtubeCollector: Collector = {
  kind: "youtube_trending",
  label: "YouTube trending (Data API v3)",
  async collect(config) {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return { items: [], note: "YOUTUBE_API_KEY not set" };
    const region = String(config.region ?? "US");
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${region}&maxResults=50&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return { items: [], note: `youtube ${res.status}` };
    const json = (await res.json()) as { items: Array<{ id: string; snippet: { title: string; channelTitle: string; publishedAt: string; tags?: string[] }; statistics: { viewCount?: string; likeCount?: string } }> };
    const items: RawItem[] = json.items.map((v) => ({
      platform: "youtube",
      externalId: v.id,
      url: `https://www.youtube.com/watch?v=${v.id}`,
      caption: v.snippet.title,
      author: v.snippet.channelTitle,
      views: Number(v.statistics.viewCount ?? 0),
      likes: Number(v.statistics.likeCount ?? 0),
      shares: 0,
      postedAt: new Date(v.snippet.publishedAt),
      tags: (v.snippet.tags ?? []).slice(0, 5).map((t) => t.toLowerCase().replace(/\s+/g, "")),
    }));
    return { items };
  },
};
