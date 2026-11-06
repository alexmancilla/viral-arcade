import { addNote } from "@/actions";

export function Notes({ notes, trendId, briefId }: { notes: { id: string; author: string; body: string; createdAt: Date }[]; trendId?: string; briefId?: string }) {
  return (
    <section className="card">
      <h3 className="font-semibold mb-3">Team notes</h3>
      <ul className="flex flex-col gap-2 mb-4">
        {notes.length === 0 ? <li className="text-sm text-zinc-500">No notes yet.</li> : null}
        {notes.map((n) => (
          <li key={n.id} className="text-sm">
            <span className="text-zinc-400">{n.author} · {n.createdAt.toLocaleString()}</span>
            <div>{n.body}</div>
          </li>
        ))}
      </ul>
      <form action={addNote} className="flex gap-2">
        <input type="hidden" name="trendId" value={trendId ?? ""} />
        <input type="hidden" name="briefId" value={briefId ?? ""} />
        <input name="author" placeholder="you" className="!w-28" />
        <input name="body" placeholder="Leave a note for the team" required />
        <button className="btn" type="submit">Add</button>
      </form>
    </section>
  );
}
