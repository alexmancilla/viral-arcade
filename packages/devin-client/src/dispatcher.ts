import { AppBriefSchema, BuildOutputSchema, buildOutputJsonSchema, type AppBrief, type BuildOutput } from "./brief";
import { buildPrompt, sessionTags, sessionTitle, type PromptOptions } from "./prompt";
import { DevinClient, isTerminal, type CreateSessionRequest, type Session } from "./client";

export interface DispatchConfig {
  /** e.g. "github.com/acme/arcade" */
  repo: string;
  playbookId?: string;
  playbookName?: string;
  knowledgeIds?: string[];
  /** Force a VM platform, e.g. "macos" when iOS Simulator verification is needed. */
  platform?: string;
}

export interface DispatchOptions extends PromptOptions {
  /** Unique id of this build attempt; folded into the idempotency key. */
  attemptId?: string;
}

export interface DispatchResult {
  session: Session | null;
  request: CreateSessionRequest;
  dryRun: boolean;
}

/**
 * The one abstraction the hub uses to talk to Devin:
 * brief in, session out; session in, normalized status out.
 */
export class BuildDispatcher {
  constructor(private client: DevinClient | null, private cfg: DispatchConfig) {}

  /**
   * Validates the brief and builds the exact API request. Pure, so the hub can show it before sending.
   * Pass `attemptId` (persisted by the caller before the call) so re-approving a revised brief gets a
   * fresh idempotency key while retries of the same attempt stay idempotent.
   */
  prepare(rawBrief: unknown, opts: DispatchOptions = {}): { brief: AppBrief; request: CreateSessionRequest } {
    const brief = AppBriefSchema.parse(rawBrief);
    const request: CreateSessionRequest = {
      title: sessionTitle(brief),
      prompt: buildPrompt(brief, { playbookName: this.cfg.playbookName, ...opts }),
      playbook_id: this.cfg.playbookId,
      repos: [this.cfg.repo],
      tags: sessionTags(brief),
      max_acu_limit: brief.acu_budget,
      resumable: true,
      platform: this.cfg.platform,
      knowledge_ids: this.cfg.knowledgeIds,
      structured_output_schema: buildOutputJsonSchema as unknown as Record<string, unknown>,
      structured_output_required: true,
      idempotency_key: opts.attemptId ? `brief-${brief.brief_id}-${opts.attemptId}` : `brief-${brief.brief_id}`,
    };
    return { brief, request };
  }

  /** Creates the session, or returns the request only when no client is configured (dry run). */
  async dispatch(rawBrief: unknown, opts: DispatchOptions = {}): Promise<DispatchResult> {
    const { request } = this.prepare(rawBrief, opts);
    if (!this.client) return { session: null, request, dryRun: true };
    const session = await this.client.createSession(request);
    return { session, request, dryRun: false };
  }

  /** Normalizes a session into what the hub stores on a BuildJob. */
  async refresh(sessionId: string): Promise<BuildJobView> {
    if (!this.client) throw new Error("Devin client not configured");
    const s = await this.client.getSession(sessionId);
    return toBuildJobView(s);
  }

  async feedback(sessionId: string, message: string): Promise<void> {
    if (!this.client) throw new Error("Devin client not configured");
    await this.client.sendMessage(sessionId, message);
  }
}

export type BuildJobStatus = "queued" | "running" | "pr_opened" | "blocked" | "failed" | "done" | "dry_run";

export interface BuildJobView {
  sessionId: string;
  url: string;
  rawStatus: Session["status"];
  status: BuildJobStatus;
  acusConsumed: number;
  prUrl: string | null;
  output: BuildOutput | null;
}

export function toBuildJobView(s: Session): BuildJobView {
  const parsed = BuildOutputSchema.safeParse(s.structured_output);
  const output = parsed.success ? parsed.data : null;
  const prUrl = output?.pr_url ?? s.pull_requests[0]?.pr_url ?? null;
  let status: BuildJobStatus = "running";
  if (s.status === "new" || s.status === "claimed") status = "queued";
  else if (output?.status === "blocked") status = "blocked";
  else if (output?.status === "failed" || s.status === "error") status = "failed";
  else if (prUrl) status = s.pull_requests.some((p) => p.pr_state === "merged") ? "done" : "pr_opened";
  else if (isTerminal(s.status)) status = "failed";
  return { sessionId: s.session_id, url: s.url, rawStatus: s.status, status, acusConsumed: s.acus_consumed ?? 0, prUrl, output };
}
