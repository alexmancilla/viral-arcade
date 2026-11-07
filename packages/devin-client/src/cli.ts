import { readFileSync } from "node:fs";
import { BuildDispatcher, DevinClient } from "./index";

/**
 * pnpm devin:dispatch path/to/brief.json [--dry-run]
 * Env: DEVIN_API_KEY, DEVIN_ORG_ID, ARCADE_REPO (github.com/owner/repo), DEVIN_PLAYBOOK_ID (optional)
 */
const [, , file, ...flags] = process.argv;
if (!file) {
  console.error("usage: dispatch <brief.json> [--dry-run]");
  process.exit(2);
}
const dry = flags.includes("--dry-run") || !process.env.DEVIN_API_KEY;
const client = dry ? null : new DevinClient({ apiKey: process.env.DEVIN_API_KEY!, orgId: process.env.DEVIN_ORG_ID! });
const dispatcher = new BuildDispatcher(client, {
  repo: process.env.ARCADE_REPO ?? "github.com/REPLACE/arcade",
  playbookId: process.env.DEVIN_PLAYBOOK_ID,
  playbookName: process.env.DEVIN_SKILL || "@skills:build-viral-game",
});
const brief = JSON.parse(readFileSync(file, "utf8"));
dispatcher
  .dispatch(brief)
  .then((r) => {
    if (r.dryRun) {
      console.log("DRY RUN. Request that would be sent:");
      console.log(JSON.stringify(r.request, null, 2));
    } else {
      console.log(`Session ${r.session!.session_id}: ${r.session!.url}`);
    }
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
