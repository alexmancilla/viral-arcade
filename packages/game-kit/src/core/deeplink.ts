export interface InvitePayload {
  /** Game slug the link opens. */
  g: string;
  /** Seed so the invitee gets the same rounds. */
  s: number;
  /** Challenger score to beat. */
  sc?: number;
  /** Challenger display name. */
  n?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeBuffer = (globalThis as any).Buffer as { from(s: string, enc: string): { toString(enc: string): string } } | undefined;

function toBase64Url(s: string): string {
  const b64 = typeof btoa === "function" ? btoa(unescape(encodeURIComponent(s))) : nodeBuffer!.from(s, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  return typeof atob === "function" ? decodeURIComponent(escape(atob(b64))) : nodeBuffer!.from(b64, "base64").toString("utf8");
}

export function encodeInvite(p: InvitePayload): string {
  return toBase64Url(JSON.stringify(p));
}

export function decodeInvite(token: string | null | undefined): InvitePayload | null {
  if (!token) return null;
  try {
    const obj = JSON.parse(fromBase64Url(token)) as Partial<InvitePayload>;
    if (typeof obj.g !== "string" || typeof obj.s !== "number") return null;
    return { g: obj.g, s: obj.s, sc: obj.sc, n: obj.n };
  } catch {
    return null;
  }
}

export interface LinkConfig {
  /** Universal link host, e.g. "arcade.example.com". */
  webHost: string;
  /** Custom scheme, e.g. "arcade". */
  scheme: string;
}

/** Https link so it works in chats; the app claims it via universal/app links and falls back to the store. */
export function buildChallengeLink(cfg: LinkConfig, invite: InvitePayload, utm = "share"): string {
  const token = encodeInvite(invite);
  return `https://${cfg.webHost}/play/${invite.g}?invite=${token}&utm_source=${utm}`;
}

export function buildSchemeLink(cfg: LinkConfig, invite: InvitePayload): string {
  return `${cfg.scheme}://play/${invite.g}?invite=${encodeInvite(invite)}`;
}
