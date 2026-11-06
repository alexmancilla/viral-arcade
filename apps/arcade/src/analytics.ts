import { createAnalytics, type AnalyticsSink } from "@viral/game-kit/core";

const consoleSink: AnalyticsSink = (e) => {
  if (__DEV__) console.log("[analytics]", e);
};

/**
 * Phase 1: add the PostHog React Native sink here. Games never see the vendor SDK.
 */
export const analytics = createAnalytics([consoleSink]);
