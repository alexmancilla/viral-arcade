import { BuildDispatcher, DevinClient } from "@viral/devin-client";

/** One place that knows how the hub talks to Devin. Everything else calls the dispatcher. */
export function getDispatcher(): { dispatcher: BuildDispatcher; configured: boolean } {
  const apiKey = process.env.DEVIN_API_KEY;
  const orgId = process.env.DEVIN_ORG_ID;
  const configured = Boolean(apiKey && orgId);
  const client = configured ? new DevinClient({ apiKey: apiKey!, orgId: orgId! }) : null;
  const dispatcher = new BuildDispatcher(client, {
    repo: process.env.ARCADE_REPO ?? "github.com/REPLACE/arcade",
    playbookId: process.env.DEVIN_PLAYBOOK_ID || undefined,
    playbookName: process.env.DEVIN_SKILL || "@skills:build-viral-game",
  });
  return { dispatcher, configured };
}
