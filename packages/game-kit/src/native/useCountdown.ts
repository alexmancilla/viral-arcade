import { useCallback, useEffect, useRef, useState } from "react";

export interface Countdown {
  remainingMs: number;
  running: boolean;
  start: () => void;
  stop: () => void;
  reset: (totalMs?: number) => void;
}

/** Wall-clock based countdown so background throttling does not stretch the timer. */
export function useCountdown(totalMs: number, onExpire?: () => void): Countdown {
  const [remainingMs, setRemaining] = useState(totalMs);
  const [running, setRunning] = useState(false);
  const total = useRef(totalMs);
  const endAt = useRef<number | null>(null);
  const expired = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (endAt.current == null) return;
      const left = Math.max(0, endAt.current - Date.now());
      setRemaining(left);
      if (left === 0 && !expired.current) {
        expired.current = true;
        setRunning(false);
        onExpire?.();
      }
    }, 50);
    return () => clearInterval(id);
  }, [running, onExpire]);

  const start = useCallback(() => {
    expired.current = false;
    endAt.current = Date.now() + total.current;
    setRemaining(total.current);
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    if (endAt.current != null) setRemaining(Math.max(0, endAt.current - Date.now()));
    setRunning(false);
  }, []);

  const reset = useCallback((next?: number) => {
    if (next != null) total.current = next;
    endAt.current = null;
    expired.current = false;
    setRunning(false);
    setRemaining(total.current);
  }, []);

  return { remainingMs, running, start, stop, reset };
}
