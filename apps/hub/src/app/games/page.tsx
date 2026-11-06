import { db } from "@/lib/db";
import { toggleGame } from "@/actions";

export const dynamic = "force-dynamic";

export default async function Games() {
  const games = await db.game.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Games and flags</h1>
      <p className="text-sm text-zinc-400">What the arcade shows. The app fetches <code>/api/flags</code> at launch; flipping a flag here is how a merged game goes live without a store release.</p>
      <table>
        <thead><tr><th>Slug</th><th>Title</th><th>Enabled</th><th>Regions</th><th></th></tr></thead>
        <tbody>
          {games.map((g) => <tr key={g.slug}><td className="font-mono">{g.slug}</td><td>{g.title}</td><td>{g.enabled ? "yes" : "no"}</td><td className="text-zinc-400">{g.regions || "all"}</td><td><form action={toggleGame}><input type="hidden" name="slug" value={g.slug} /><button className="btn-ghost">{g.enabled ? "Disable" : "Enable"}</button></form></td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
