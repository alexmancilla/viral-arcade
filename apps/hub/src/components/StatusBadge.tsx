const colors: Record<string, string> = {
  watching: "bg-zinc-800 text-zinc-300",
  candidate: "bg-amber-900/60 text-amber-200",
  briefed: "bg-sky-900/60 text-sky-200",
  building: "bg-violet-900/60 text-violet-200",
  live: "bg-emerald-900/60 text-emerald-200",
  retired: "bg-zinc-800 text-zinc-500",
  draft: "bg-zinc-800 text-zinc-300",
  in_review: "bg-amber-900/60 text-amber-200",
  approved: "bg-sky-900/60 text-sky-200",
  dispatched: "bg-violet-900/60 text-violet-200",
  rejected: "bg-rose-900/60 text-rose-200",
  queued: "bg-zinc-800 text-zinc-300",
  running: "bg-violet-900/60 text-violet-200",
  pr_opened: "bg-sky-900/60 text-sky-200",
  blocked: "bg-amber-900/60 text-amber-200",
  failed: "bg-rose-900/60 text-rose-200",
  done: "bg-emerald-900/60 text-emerald-200",
  dry_run: "bg-zinc-800 text-zinc-400",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${colors[status] ?? ""}`}>{status.replace("_", " ")}</span>;
}
