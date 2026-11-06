/**
 * Thin typed wrapper over the Devin API v3. Only the calls the platform needs.
 * Docs: https://docs.devin.ai/api-reference/v3/sessions/post-organizations-sessions
 */
export interface DevinClientConfig {
  apiKey: string;
  orgId: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export type SessionStatus = "new" | "claimed" | "running" | "exit" | "error" | "suspended" | "resuming";

export interface CreateSessionRequest {
  prompt: string;
  title?: string;
  playbook_id?: string;
  repos?: string[];
  tags?: string[];
  max_acu_limit?: number;
  resumable?: boolean;
  platform?: string;
  knowledge_ids?: string[];
  structured_output_schema?: Record<string, unknown>;
  structured_output_required?: boolean;
  idempotency_key?: string;
}

export interface Session {
  session_id: string;
  url: string;
  status: SessionStatus;
  status_detail?: string | null;
  title?: string | null;
  tags: string[];
  acus_consumed: number;
  created_at: number;
  updated_at: number;
  pull_requests: { pr_url: string; pr_state: string | null }[];
  structured_output?: unknown;
}

export class DevinApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`Devin API ${status}: ${body.slice(0, 300)}`);
  }
}

export class DevinClient {
  private base: string;
  private f: typeof fetch;
  constructor(private cfg: DevinClientConfig) {
    this.base = (cfg.baseUrl ?? "https://api.devin.ai").replace(/\/$/, "");
    this.f = cfg.fetchImpl ?? fetch;
  }

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await this.f(`${this.base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.cfg.apiKey}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new DevinApiError(res.status, text);
    return (text ? JSON.parse(text) : {}) as T;
  }

  createSession(req: CreateSessionRequest): Promise<Session> {
    return this.call<Session>("POST", `/v3/organizations/${this.cfg.orgId}/sessions`, req);
  }

  getSession(sessionId: string): Promise<Session> {
    return this.call<Session>("GET", `/v3/organizations/${this.cfg.orgId}/sessions/${sessionId}`);
  }

  /** Send a follow-up (reviewer feedback, unblock answer) into a running or resumable session. */
  sendMessage(sessionId: string, message: string): Promise<unknown> {
    return this.call("POST", `/v3/organizations/${this.cfg.orgId}/sessions/${sessionId}/messages`, { message });
  }

  listSessions(params: { tags?: string[]; limit?: number } = {}): Promise<{ items: Session[] }> {
    const q = new URLSearchParams();
    for (const t of params.tags ?? []) q.append("tags", t);
    if (params.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return this.call("GET", `/v3/organizations/${this.cfg.orgId}/sessions${qs ? `?${qs}` : ""}`);
  }
}

export function isTerminal(status: SessionStatus): boolean {
  return status === "exit" || status === "error";
}
