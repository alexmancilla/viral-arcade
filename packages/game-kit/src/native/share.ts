import { Share } from "react-native";
import { buildChallengeLink, buildSchemeLink, type InvitePayload, type LinkConfig } from "../core/deeplink";

/**
 * EXPO_PUBLIC_SHARE_HOST is the universal/app-link host (must match app.json associatedDomains / intentFilters).
 * Until a real domain is configured, shares fall back to the arcade:// scheme link, which opens for installed users.
 */
// Expo inlines EXPO_PUBLIC_* only when referenced literally as process.env.X; game-kit has no node types.
declare const process: { env: Record<string, string | undefined> };

export const defaultLinkConfig: LinkConfig = { webHost: process.env.EXPO_PUBLIC_SHARE_HOST ?? "", scheme: "arcade" };

export async function shareChallenge(opts: {
  title: string;
  message: string;
  invite: InvitePayload;
  link?: LinkConfig;
}): Promise<"shared" | "dismissed"> {
  const cfg = opts.link ?? defaultLinkConfig;
  const url = cfg.webHost ? buildChallengeLink(cfg, opts.invite) : buildSchemeLink(cfg, opts.invite);
  try {
    const res = await Share.share({ title: opts.title, message: `${opts.message}\n${url}`, url });
    return res.action === Share.sharedAction ? "shared" : "dismissed";
  } catch {
    return "dismissed";
  }
}
