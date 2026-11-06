import { Share } from "react-native";
import { buildChallengeLink, type InvitePayload, type LinkConfig } from "../core/deeplink";

export const defaultLinkConfig: LinkConfig = { webHost: "arcade.example.com", scheme: "arcade" };

export async function shareChallenge(opts: {
  title: string;
  message: string;
  invite: InvitePayload;
  link?: LinkConfig;
}): Promise<"shared" | "dismissed"> {
  const url = buildChallengeLink(opts.link ?? defaultLinkConfig, opts.invite);
  try {
    const res = await Share.share({ title: opts.title, message: `${opts.message}\n${url}`, url });
    return res.action === Share.sharedAction ? "shared" : "dismissed";
  } catch {
    return "dismissed";
  }
}
