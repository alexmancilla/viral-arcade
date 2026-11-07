import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Consumed by apps/arcade/src/flags.ts: { "reverse-it": true, "impostor": false } */
export async function GET() {
  const games = await db.game.findMany();
  const flags = Object.fromEntries(games.map((g) => [g.slug, g.enabled]));
  return NextResponse.json(flags, { headers: { "Cache-Control": "public, max-age=60" } });
}
