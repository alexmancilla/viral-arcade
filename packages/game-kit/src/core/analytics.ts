export type GameEvent =
  | { name: "game_start"; game: string; invite: boolean }
  | { name: "game_end"; game: string; score: number; rounds: number; durationMs: number }
  | { name: "share_click"; game: string; channel: "native" | "copy" }
  | { name: "invite_opened"; game: string; fromScore?: number }
  | { name: "game_exit"; game: string; atRound: number };

export type AnalyticsSink = (event: GameEvent & { ts: number }) => void;

export interface Analytics {
  track: (event: GameEvent) => void;
}

/** One analytics object for the whole app; games receive it through GameProps and never import a vendor SDK. */
export function createAnalytics(sinks: AnalyticsSink[]): Analytics {
  return {
    track(event) {
      const enriched = { ...event, ts: Date.now() };
      for (const sink of sinks) {
        try {
          sink(enriched);
        } catch {
          // a broken sink must never break a game
        }
      }
    },
  };
}

export function memorySink(buffer: Array<GameEvent & { ts: number }>): AnalyticsSink {
  return (e) => {
    buffer.push(e);
  };
}
