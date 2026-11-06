export interface RawItem {
  platform: string;
  externalId: string;
  url: string;
  caption: string;
  author: string;
  views: number;
  likes: number;
  shares: number;
  postedAt: Date;
  /** Hashtags or keywords used to group items into a Trend. */
  tags: string[];
}

export interface Collector {
  kind: string;
  label: string;
  /** Pulls the current top items. Must not throw for rate limits; return [] and set a note. */
  collect(config: Record<string, unknown>): Promise<{ items: RawItem[]; note?: string }>;
}
