export type RoundsPhase = "idle" | "playing" | "between" | "done";

export interface RoundsState {
  index: number;
  total: number;
  scores: number[];
  phase: RoundsPhase;
}

export type RoundsAction =
  | { type: "start" }
  | { type: "score"; points: number }
  | { type: "next" }
  | { type: "reset" };

export function initialRounds(total: number): RoundsState {
  return { index: 0, total, scores: [], phase: "idle" };
}

export function roundsReducer(state: RoundsState, action: RoundsAction): RoundsState {
  switch (action.type) {
    case "start":
      return { ...state, index: 0, scores: [], phase: "playing" };
    case "score": {
      if (state.phase !== "playing") return state;
      const scores = [...state.scores, action.points];
      const last = state.index >= state.total - 1;
      return { ...state, scores, phase: last ? "done" : "between" };
    }
    case "next":
      if (state.phase !== "between") return state;
      return { ...state, index: state.index + 1, phase: "playing" };
    case "reset":
      return initialRounds(state.total);
  }
}
