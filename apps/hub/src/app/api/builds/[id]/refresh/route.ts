import { NextResponse } from "next/server";
import { refreshBuildById } from "@/actions";
import { db } from "@/lib/db";

/** For a cron or a GitHub/Devin webhook: POST /api/builds/<id>/refresh */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await refreshBuildById(id);
  const job = await db.buildJob.findUnique({ where: { id } });
  return NextResponse.json(job);
}
