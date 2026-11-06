import { describe, expect, it } from "vitest";
import { BuildDispatcher, DevinClient, toBuildJobView, type Session } from "../src/index";
import brief from "../examples/reverse-it.brief.json";

const cfg = { repo: "github.com/acme/arcade", playbookId: "pb_1", playbookName: "Viral game builder" };

describe("BuildDispatcher", () => {
  it("prepares a valid request from a brief", () => {
    const d = new BuildDispatcher(null, cfg);
    const { request } = d.prepare(brief);
    expect(request.repos).toEqual(["github.com/acme/arcade"]);
    expect(request.tags).toContain("brief:brf_demo_reverse_it");
    expect(request.max_acu_limit).toBe(20);
    expect(request.prompt).toContain("templates/guess_phrase");
    expect(request.prompt).toContain("<brief>");
    expect(request.structured_output_schema).toBeTruthy();
  });

  it("rejects an invalid brief before any API call", () => {
    const d = new BuildDispatcher(null, cfg);
    expect(() => d.prepare({ ...brief, slug: "Not A Slug" })).toThrow();
  });

  it("dry-runs without a client", async () => {
    const d = new BuildDispatcher(null, cfg);
    const r = await d.dispatch(brief);
    expect(r.dryRun).toBe(true);
    expect(r.session).toBeNull();
  });

  it("posts to the v3 sessions endpoint", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ session_id: "devin-1", url: "https://app.devin.ai/sessions/1", status: "new", tags: [], acus_consumed: 0, created_at: 0, updated_at: 0, pull_requests: [] }), { status: 200 });
    }) as unknown as typeof fetch;
    const client = new DevinClient({ apiKey: "k", orgId: "org-x", fetchImpl });
    const r = await new BuildDispatcher(client, cfg).dispatch(brief);
    expect(r.session?.session_id).toBe("devin-1");
    expect(calls[0]?.url).toBe("https://api.devin.ai/v3/organizations/org-x/sessions");
    expect((calls[0]?.init.headers as Record<string, string>).Authorization).toBe("Bearer k");
  });
});

describe("toBuildJobView", () => {
  const base: Session = { session_id: "s", url: "u", status: "running", tags: [], acus_consumed: 3, created_at: 0, updated_at: 0, pull_requests: [] };
  it("maps queued, running, pr_opened, done, blocked, failed", () => {
    expect(toBuildJobView({ ...base, status: "new" }).status).toBe("queued");
    expect(toBuildJobView(base).status).toBe("running");
    expect(toBuildJobView({ ...base, pull_requests: [{ pr_url: "https://g/pr/1", pr_state: "open" }] }).status).toBe("pr_opened");
    expect(toBuildJobView({ ...base, status: "exit", pull_requests: [{ pr_url: "https://g/pr/1", pr_state: "merged" }] }).status).toBe("done");
    expect(toBuildJobView({ ...base, structured_output: { status: "blocked", slug: "x", blockers: ["needs native module"] } }).status).toBe("blocked");
    expect(toBuildJobView({ ...base, status: "exit" }).status).toBe("failed");
  });
});

describe("idempotency per attempt", () => {
  it("changes the idempotency key when an attemptId is given", async () => {
    const { BuildDispatcher } = await import("../src/dispatcher");
    const brief = (await import("../examples/reverse-it.brief.json")).default;
    const d = new BuildDispatcher(null, { repo: "github.com/acme/arcade" });
    expect(d.prepare(brief).request.idempotency_key).toBe(`brief-${brief.brief_id}`);
    expect(d.prepare(brief, { attemptId: "job_1" }).request.idempotency_key).toBe(`brief-${brief.brief_id}-job_1`);
    expect(d.prepare(brief, { attemptId: "job_2" }).request.idempotency_key).not.toBe(d.prepare(brief, { attemptId: "job_1" }).request.idempotency_key);
  });
});
