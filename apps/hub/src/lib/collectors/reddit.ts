import type { Collector, RawItem } from "./types";

/** Public Reddit JSON listing. No key needed; rate limited, so run it a few times a day at most. */
export const redditCollector: Collector = {
  kind: "reddit",
  label: "Reddit top posts",
  async collect(config) {
    const sub = String(config.subreddit ?? "TikTokCringe");
    const res = await fetch(`https://www.reddit.com/r/${sub}/top.json?t=day&limit=50`, { headers: { "User-Agent": "viral-hub/0.1" } });
    if (!res.ok) return { items: [], note: `reddit ${res.status}` };
    const json = (await res.json()) as { data: { children: Array<{ data: { id: string; title: string; author: string; ups: number; num_comments: number; created_utc: number; permalink: string; link_flair_text?: string } }> } };
    const items: RawItem[] = json.data.children.map(({ data: p }) => ({
      platform: "reddit",
      externalId: p.id,
      url: `https://www.reddit.com${p.permalink}`,
      caption: p.title,
      author: p.author,
      views: p.ups * 20, // reddit hides views; upvotes are a stable proxy
      likes: p.ups,
      shares: p.num_comments,
      postedAt: new Date(p.created_utc * 1000),
      tags: hashtagsFrom(p.title).concat(p.link_flair_text ? [p.link_flair_text.toLowerCase()] : []),
    }));
    return { items };
  },
};

export function hashtagsFrom(text: string): string[] {
  const tags = text.match(/#\w+/g) ?? [];
  return tags.map((t) => t.slice(1).toLowerCase());
}
